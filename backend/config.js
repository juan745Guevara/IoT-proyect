const PORT = Number(process.env.PORT) || 3000;
const MQTT_URL = process.env.MQTT_URL || "mqtt://127.0.0.1:1883";

const ACTUADORES_VALIDOS = ["ventilador", "bomba"];
const ESTADOS_VALIDOS = ["ON", "OFF"];

const MQTT_TOPIC_SENSORES = "invernadero/sensores";
const MQTT_TOPIC_ACTUADORES = "invernadero/actuadores";

const ESTADO_INICIAL_ACTUADORES = Object.fromEntries(
  ACTUADORES_VALIDOS.map((actuador) => [actuador, "OFF"])
);

module.exports = {
  PORT,
  MQTT_URL,
  ACTUADORES_VALIDOS,
  ESTADOS_VALIDOS,
  MQTT_TOPIC_SENSORES,
  MQTT_TOPIC_ACTUADORES,
  ESTADO_INICIAL_ACTUADORES,
};
