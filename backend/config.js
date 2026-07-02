const PORT = Number(process.env.PORT) || 3000;
const MQTT_URL =
  process.env.MQTT_URL ||
  `mqtt://${process.env.MQTT_HOST || "127.0.0.1"}:${process.env.MQTT_PORT || 1883}`;

const ACTUADORES_VALIDOS = ["ventilador", "bomba"];
const ESTADOS_VALIDOS = ["ON", "OFF"];
const ZONA_DEFAULT = "zona1";
const ZONA_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

const MQTT_TOPIC_SENSORES_WILDCARD = "invernadero/+/sensores";
const MQTT_TOPIC_HEARTBEAT_WILDCARD = "invernadero/+/heartbeat";
const MQTT_TOPIC_ACTUADORES_WILDCARD = "invernadero/+/actuadores";

const SENSORES_VALIDOS = ["temperatura", "humedad_aire", "humedad_suelo", "luminosidad"];
const RANGOS_HISTORIAL = ["24h", "7d", "30d"];

const HISTORIAL_INTERVALO_MIN = Number(process.env.HISTORIAL_INTERVALO_MIN) || 5;
const RETENCION_DIAS = Number(process.env.RETENCION_DIAS) || 30;
const CONEXION_TIMEOUT_MS = 15000;

const ANOMALIA_TEMP_DELTA = Number(process.env.ANOMALIA_TEMP_DELTA) || 5;
const ANOMALIA_HAIRE_DELTA = Number(process.env.ANOMALIA_HAIRE_DELTA) || 20;
const ANOMALIA_HSUELO_DELTA = Number(process.env.ANOMALIA_HSUELO_DELTA) || 30;

const ESTADO_INICIAL_ACTUADORES = Object.fromEntries(
  ACTUADORES_VALIDOS.map((actuador) => [actuador, "OFF"])
);

function topicSensores(zona_id) {
  return `invernadero/${zona_id}/sensores`;
}

function topicActuadores(zona_id) {
  return `invernadero/${zona_id}/actuadores`;
}

function topicHeartbeat(zona_id) {
  return `invernadero/${zona_id}/heartbeat`;
}

function validarZonaId(zona_id) {
  if (!zona_id || typeof zona_id !== "string" || !ZONA_ID_REGEX.test(zona_id)) {
    return "zona_id inválido (solo letras, números, guiones)";
  }
  return null;
}

module.exports = {
  PORT,
  MQTT_URL,
  ACTUADORES_VALIDOS,
  ESTADOS_VALIDOS,
  ZONA_DEFAULT,
  ZONA_ID_REGEX,
  MQTT_TOPIC_SENSORES_WILDCARD,
  MQTT_TOPIC_HEARTBEAT_WILDCARD,
  MQTT_TOPIC_ACTUADORES_WILDCARD,
  SENSORES_VALIDOS,
  RANGOS_HISTORIAL,
  HISTORIAL_INTERVALO_MIN,
  RETENCION_DIAS,
  CONEXION_TIMEOUT_MS,
  ANOMALIA_TEMP_DELTA,
  ANOMALIA_HAIRE_DELTA,
  ANOMALIA_HSUELO_DELTA,
  ESTADO_INICIAL_ACTUADORES,
  topicSensores,
  topicActuadores,
  topicHeartbeat,
  validarZonaId,
};
