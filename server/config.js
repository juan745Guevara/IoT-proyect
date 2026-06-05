const PORT = Number(process.env.PORT) || 3000;
const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";

const LEDS_VALIDOS = ["rojo", "verde", "azul"];
const ESTADOS_VALIDOS = ["ON", "OFF"];

const ESTADO_INICIAL = Object.fromEntries(
  LEDS_VALIDOS.map((led) => [led, "OFF"])
);

module.exports = {
  PORT,
  MQTT_URL,
  LEDS_VALIDOS,
  ESTADOS_VALIDOS,
  ESTADO_INICIAL,
};
