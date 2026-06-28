const mqtt = require("mqtt");
const {
  MQTT_URL,
  MQTT_TOPIC_SENSORES,
  MQTT_TOPIC_ACTUADORES,
} = require("../config");
const { setSensores } = require("../state/invernadero");

const client = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  console.log("[MQTT] Conectado al broker en", MQTT_URL);
  client.subscribe(MQTT_TOPIC_SENSORES, (err) => {
    if (err) {
      console.error("[MQTT] Error al suscribirse a sensores:", err.message);
      return;
    }
    console.log("[MQTT] Suscrito a", MQTT_TOPIC_SENSORES);
  });
});

client.on("error", (err) => {
  console.error("[MQTT] Error:", err.message);
});

client.on("reconnect", () => {
  console.log("[MQTT] Reintentando conexión...");
});

client.on("close", () => {
  console.log("[MQTT] Conexión cerrada");
});

client.on("message", (topic, payload) => {
  if (topic !== MQTT_TOPIC_SENSORES) {
    return;
  }

  try {
    const raw = payload.toString().replace(/^\uFEFF/, "").trim();
    const data = JSON.parse(raw);
    setSensores({
      temperatura: data.temperatura ?? null,
      humedad_aire: data.humedad_aire ?? null,
      humedad_suelo: data.humedad_suelo ?? null,
      luminosidad: data.luminosidad ?? null,
    });
    console.log("[MQTT] Sensores actualizados:", data);
  } catch (err) {
    console.error("[MQTT] JSON inválido en sensores:", err.message);
  }
});

function publicarComando(actuador, estado, callback) {
  const payload = JSON.stringify({ actuador, estado });
  client.publish(MQTT_TOPIC_ACTUADORES, payload, callback);
}

module.exports = { client, publicarComando };
