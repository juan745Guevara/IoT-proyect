const mqtt = require("mqtt");
const {
  MQTT_URL,
  MQTT_TOPIC_SENSORES_WILDCARD,
  MQTT_TOPIC_ACTUADORES_WILDCARD,
  MQTT_TOPIC_HEARTBEAT_WILDCARD,
  HISTORIAL_INTERVALO_MIN,
  ACTUADORES_VALIDOS,
  ESTADOS_VALIDOS,
  ZONA_DEFAULT,
  topicActuadores,
} = require("../config");
const {
  registrarZona,
  setZona,
  getZona,
  setActuador,
} = require("../state/invernadero");
const { insertarLectura } = require("../db/historial");
const { emitirEstadoZonas } = require("../helpers/zonasEstado");
const { emitSensores, emitActuadores } = require("../socket");
const { evaluarAnomalias } = require("../analisis/anomalias");
const {
  obtenerTodosPendientes,
  marcarProcesado,
  incrementarIntento,
} = require("../db/comandos");
const { setActuador: setActuadorState } = require("../state/invernadero");

const ultimoGuardadoDb = {};
let mqttConectado = false;
const client = mqtt.connect(MQTT_URL, { reconnectPeriod: 5000 });

function isMqttConectado() {
  return mqttConectado && client.connected;
}

function extraerZonaDeTopic(topic, sufijo) {
  const partes = topic.split("/");
  if (partes.length === 3 && partes[0] === "invernadero" && partes[2] === sufijo) {
    return partes[1];
  }
  return null;
}

function suscribirTopics() {
  const topics = [
    MQTT_TOPIC_SENSORES_WILDCARD,
    MQTT_TOPIC_ACTUADORES_WILDCARD,
    MQTT_TOPIC_HEARTBEAT_WILDCARD,
  ];

  for (const topic of topics) {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error("[MQTT] Error al suscribirse a", topic, err.message);
        return;
      }
      console.log("[MQTT] Suscrito a", topic);
    });
  }
}

client.on("connect", () => {
  mqttConectado = true;
  console.log("[MQTT] Conectado al broker en", MQTT_URL);
  suscribirTopics();
  procesarColaPendientes().catch((err) => {
    console.error("[Queue] Error al drenar cola:", err.message);
  });
});

client.on("reconnect", () => {
  console.log("[MQTT] Reintentando conexión...");
});

client.on("close", () => {
  mqttConectado = false;
  console.log("[MQTT] Conexión cerrada");
});

client.on("error", (err) => {
  console.error("[MQTT] Error:", err.message);
});

async function guardarHistorialSiCorresponde(zona_id, datos) {
  const ahora = Date.now();
  const intervaloMs = HISTORIAL_INTERVALO_MIN * 60 * 1000;
  const ultimo = ultimoGuardadoDb[zona_id] || 0;

  if (ahora - ultimo < intervaloMs) {
    return;
  }

  ultimoGuardadoDb[zona_id] = ahora;
  const insertado = await insertarLectura(zona_id, datos);
  if (insertado) {
    console.log(`[DB] Lectura guardada zona ${zona_id} (id: ${insertado.id})`);
  }
}

function procesarHeartbeat(zona_id) {
  registrarZona(zona_id);
  setZona(zona_id, {
    ultima_lectura: new Date().toISOString(),
    conectado: true,
  });
  emitirEstadoZonas().catch(() => {});
}

function procesarSensores(zona_id, payload) {
  try {
    const raw = payload.toString().replace(/^\uFEFF/, "").trim();
    const data = JSON.parse(raw);

    registrarZona(zona_id);
    setZona(zona_id, {
      sensores: {
        temperatura: data.temperatura ?? null,
        humedad_aire: data.humedad_aire ?? null,
        humedad_suelo: data.humedad_suelo ?? null,
        luminosidad: data.luminosidad ?? null,
      },
      ultima_lectura: new Date().toISOString(),
      conectado: true,
    });

    const estado = getZona(zona_id);
    emitSensores(zona_id, estado.sensores);
    emitirEstadoZonas().catch(() => {});
    console.log(`[MQTT] Sensores ${zona_id}:`, data);

    evaluarAnomalias(zona_id, estado.sensores).catch((err) => {
      console.error("[ANOMALIA] Error:", err.message);
    });

    const { evaluarAutomatico } = require("../automatico/motor");
    evaluarAutomatico(zona_id, {
      temperatura: estado.sensores.temperatura,
      humedad_aire: estado.sensores.humedad_aire,
      humedad_suelo: estado.sensores.humedad_suelo,
      luminosidad: estado.sensores.luminosidad,
    }).catch((err) => {
      console.error("[AUTO] Error en evaluación:", err.message);
    });

    guardarHistorialSiCorresponde(zona_id, {
      temperatura: estado.sensores.temperatura,
      humedad_aire: estado.sensores.humedad_aire,
      humedad_suelo: estado.sensores.humedad_suelo,
      luminosidad: estado.sensores.luminosidad,
    }).catch((err) => {
      console.error("[DB] Error al guardar historial:", err.message);
    });
  } catch (err) {
    console.error("[MQTT] JSON inválido en sensores:", err.message);
  }
}

function procesarActuadores(zona_id, payload) {
  try {
    const raw = payload.toString().replace(/^\uFEFF/, "").trim();
    const data = JSON.parse(raw);
    const { actuador, estado } = data;

    if (!actuador || !ACTUADORES_VALIDOS.includes(actuador)) {
      return;
    }
    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return;
    }

    registrarZona(zona_id);
    setActuador(zona_id, actuador, estado);
    const actuadores = getZona(zona_id).actuadores;
    emitActuadores(zona_id, actuadores);
    console.log(`[MQTT] Actuadores ${zona_id}:`, actuadores);
  } catch (err) {
    console.error("[MQTT] JSON inválido en actuadores:", err.message);
  }
}

client.on("message", (topic, payload) => {
  const zonaHeartbeat = extraerZonaDeTopic(topic, "heartbeat");
  if (zonaHeartbeat) {
    procesarHeartbeat(zonaHeartbeat);
    return;
  }

  const zonaSensores = extraerZonaDeTopic(topic, "sensores");
  if (zonaSensores) {
    procesarSensores(zonaSensores, payload);
    return;
  }

  const zonaActuadores = extraerZonaDeTopic(topic, "actuadores");
  if (zonaActuadores) {
    procesarActuadores(zonaActuadores, payload);
  }
});

function publicarComando(zona_id, actuador, estado, callback) {
  const zona = zona_id || ZONA_DEFAULT;
  const payload = JSON.stringify({ actuador, estado });
  client.publish(topicActuadores(zona), payload, callback);
}

async function procesarColaPendientes() {
  if (!isMqttConectado()) {
    return;
  }

  const pendientes = await obtenerTodosPendientes();

  for (const cmd of pendientes) {
    await new Promise((resolve) => {
      publicarComando(cmd.zona_id, cmd.actuador, cmd.estado, async (err) => {
        if (err) {
          await incrementarIntento(cmd.id);
          console.error("[Queue] Falló publicar:", err.message);
          return resolve();
        }

        setActuadorState(cmd.zona_id, cmd.actuador, cmd.estado);
        emitActuadores(cmd.zona_id, getZona(cmd.zona_id).actuadores);
        await marcarProcesado(cmd.id);
        console.log(`[Queue] Comando ejecutado ${cmd.zona_id}/${cmd.actuador}→${cmd.estado}`);
        resolve();
      });
    });
  }
}

module.exports = { client, publicarComando, isMqttConectado, procesarColaPendientes };
