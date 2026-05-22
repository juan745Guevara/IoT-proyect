const express = require("express");
const mqtt = require("mqtt");

const PORT = 3000;
const MQTT_URL = "mqtt://localhost:1883";
const LEDS_VALIDOS = ["rojo", "verde", "azul"];
const ESTADOS_VALIDOS = ["ON", "OFF"];

const estadoLeds = {
  rojo: "OFF",
  verde: "OFF",
  azul: "OFF",
};

const app = express();
app.use(express.json());
app.use(express.static("public"));

const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on("connect", () => {
  console.log("[MQTT] Conectado al broker en", MQTT_URL);
});

mqttClient.on("error", (err) => {
  console.error("[MQTT] Error:", err.message);
});

mqttClient.on("reconnect", () => {
  console.log("[MQTT] Reintentando conexión...");
});

mqttClient.on("close", () => {
  console.log("[MQTT] Conexión cerrada");
});

function topicParaLed(led) {
  return `smarthome/led/${led}`;
}

app.post("/api/led", (req, res) => {
  const { led, estado } = req.body;

  console.log("[API] POST /api/led — body:", req.body);

  if (!led || !LEDS_VALIDOS.includes(led)) {
    console.log("[API] LED no válido:", led);
    return res.status(400).json({ ok: false, error: "LED no válido" });
  }

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    console.log("[API] Estado no válido:", estado);
    return res.status(400).json({ ok: false, error: "Estado no válido" });
  }

  const topic = topicParaLed(led);
  const payload = JSON.stringify({ estado });

  mqttClient.publish(topic, payload, (err) => {
    if (err) {
      console.error("[MQTT] Error al publicar en", topic, ":", err.message);
      return res.status(500).json({ ok: false, error: "Error al publicar en MQTT" });
    }

    estadoLeds[led] = estado;
    console.log("[MQTT] Publicado en", topic, "→", payload);
    console.log("[API] Estado actualizado en memoria:", estadoLeds);
    res.json({ ok: true, led, estado });
  });
});

app.get("/api/estado", (_req, res) => {
  console.log("[API] GET /api/estado —", estadoLeds);
  res.json({ ...estadoLeds });
});

app.listen(PORT, () => {
  console.log(`[HTTP] Servidor escuchando en http://localhost:${PORT}`);
});
