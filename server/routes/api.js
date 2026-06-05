const express = require("express");
const { LEDS_VALIDOS, ESTADOS_VALIDOS } = require("../config");
const { getEstado, setLed } = require("../state/leds");
const { publicarLed } = require("../mqtt/client");

const router = express.Router();

router.post("/led", (req, res) => {
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

  const payload = JSON.stringify({ estado });

  publicarLed(led, payload, (err) => {
    if (err) {
      console.error("[MQTT] Error al publicar:", err.message);
      return res.status(500).json({ ok: false, error: "Error al publicar en MQTT" });
    }

    setLed(led, estado);
    console.log("[MQTT] Publicado smarthome/led/" + led, "→", payload);
    console.log("[API] Estado actualizado en memoria:", getEstado());
    res.json({ ok: true, led, estado });
  });
});

router.get("/estado", (_req, res) => {
  const estado = getEstado();
  console.log("[API] GET /api/estado —", estado);
  res.json(estado);
});

module.exports = router;
