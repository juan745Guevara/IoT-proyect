const express = require("express");
const { ACTUADORES_VALIDOS, ESTADOS_VALIDOS } = require("../config");
const { getSensores, getActuadores, setActuador } = require("../state/invernadero");
const { publicarComando } = require("../mqtt/client");

const router = express.Router();

router.get("/sensores", (_req, res) => {
  const sensores = getSensores();
  console.log("[API] GET /api/sensores —", sensores);
  res.json(sensores);
});

router.get("/actuadores", (_req, res) => {
  const actuadores = getActuadores();
  console.log("[API] GET /api/actuadores —", actuadores);
  res.json(actuadores);
});

router.post("/actuador", (req, res) => {
  const { actuador, estado } = req.body;

  console.log("[API] POST /api/actuador — body:", req.body);

  if (!actuador || !ACTUADORES_VALIDOS.includes(actuador)) {
    console.log("[API] Actuador no válido:", actuador);
    return res.status(400).json({ error: "Actuador inválido" });
  }

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    console.log("[API] Estado no válido:", estado);
    return res.status(400).json({ error: "Estado inválido" });
  }

  publicarComando(actuador, estado, (err) => {
    if (err) {
      console.error("[MQTT] Error al publicar:", err.message);
      return res.status(500).json({ error: "Error al publicar en MQTT" });
    }

    setActuador(actuador, estado);
    console.log("[MQTT] Publicado invernadero/actuadores →", { actuador, estado });
    console.log("[API] Estado actualizado en memoria:", getActuadores());
    res.json({ ok: true, actuador, estado });
  });
});

module.exports = router;
