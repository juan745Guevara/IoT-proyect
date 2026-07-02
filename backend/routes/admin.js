const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { isDbDisponible, getPool } = require("../db/index");
const { client, isMqttConectado } = require("../mqtt/client");
const { getTodasZonas } = require("../state/invernadero");
const { construirEstadoZonas } = require("../helpers/zonasEstado");
const { listarUsuarios, crearUsuario, actualizarUsuario, desactivarUsuario, ROLES } = require("../db/users");
const { obtenerLogs } = require("../db/systemLog");
const { ejecutarBackup, listarBackups } = require("../jobs/backup");
const { obtenerTodosPendientes } = require("../db/comandos");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", async (_req, res) => {
  const pool = getPool();
  let dbStats = {};

  if (pool) {
    try {
      const lecturas = await pool.query("SELECT COUNT(*)::int AS n FROM lecturas_sensores");
      const alertas = await pool.query(
        "SELECT COUNT(*)::int AS n FROM alertas WHERE resuelta = false"
      );
      const comandos = await pool.query(
        "SELECT COUNT(*)::int AS n FROM comandos_pendientes WHERE procesado = false"
      );
      dbStats = {
        lecturas: lecturas.rows[0]?.n ?? 0,
        alertas_activas: alertas.rows[0]?.n ?? 0,
        comandos_pendientes: comandos.rows[0]?.n ?? 0,
      };
    } catch (err) {
      dbStats.error = err.message;
    }
  }

  const zonasMem = getTodasZonas();
  const conectadas = Object.values(zonasMem).filter((z) => z.conectado).length;

  res.json({
    uptime_seg: Math.floor(process.uptime()),
    db: isDbDisponible(),
    mqtt: isMqttConectado(),
    zonas_conectadas: conectadas,
    zonas_total: Object.keys(zonasMem).length,
    db_stats: dbStats,
    memoria_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
});

router.get("/zonas", async (_req, res) => {
  const zonas = await construirEstadoZonas();
  res.json(zonas);
});

router.get("/usuarios", async (_req, res) => {
  const usuarios = await listarUsuarios();
  res.json(usuarios);
});

router.post("/usuarios", async (req, res) => {
  const { usuario, password, rol } = req.body;
  if (!usuario || !password || !rol) {
    return res.status(400).json({ error: "usuario, password y rol requeridos" });
  }
  if (!ROLES.includes(rol)) {
    return res.status(400).json({ error: `rol debe ser: ${ROLES.join(", ")}` });
  }
  try {
    const creado = await crearUsuario({ usuario, password, rol });
    res.status(201).json(creado);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Usuario ya existe" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put("/usuarios/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rol, activo } = req.body;
  try {
    const actualizado = await actualizarUsuario(id, { rol, activo });
    if (!actualizado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/usuarios/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) {
    return res.status(400).json({ error: "No puedes desactivar tu propio usuario" });
  }
  const desactivado = await desactivarUsuario(id);
  if (!desactivado) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.json(desactivado);
});

router.get("/backups", (_req, res) => {
  res.json(listarBackups());
});

router.get("/logs", async (req, res) => {
  const limite = Math.min(parseInt(req.query.limite, 10) || 100, 500);
  const logs = await obtenerLogs({ limite });
  res.json(logs);
});

router.get("/comandos-pendientes", async (_req, res) => {
  const cmds = await obtenerTodosPendientes();
  res.json(cmds);
});

router.post("/backup", async (_req, res) => {
  const result = await ejecutarBackup();
  if (!result.ok) {
    return res.status(500).json(result);
  }
  res.json({
    ...result,
    mensaje: `Backup creado: ${result.archivo}`,
  });
});

module.exports = router;
