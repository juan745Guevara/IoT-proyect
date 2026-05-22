const express = require("express");
const mqtt = require("mqtt");
const path = require("path");
const fs = require("fs");

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

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

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

const distPath = path.join(__dirname, "smarthome-frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
  console.log("[HTTP] Sirviendo frontend desde smarthome-frontend/dist");
} else {
  console.log(
    "[HTTP] Frontend no compilado. Desarrollo: cd smarthome-frontend && npm run dev | Producción: npm run build"
  );
}

app.listen(PORT, () => {
  console.log(`[HTTP] Servidor escuchando en http://localhost:${PORT}`);
});
