const mqtt = require("mqtt");
const { MQTT_URL } = require("../config");

const client = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  console.log("[MQTT] Conectado al broker en", MQTT_URL);
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

function topicParaLed(led) {
  return `smarthome/led/${led}`;
}

function publicarLed(led, payload, callback) {
  client.publish(topicParaLed(led), payload, callback);
}

module.exports = { client, topicParaLed, publicarLed };
