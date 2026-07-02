const express = require("express");
const cors = require("./middleware/cors");
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const { registrarFrontend } = require("./static");
const { apiLimiter } = require("./middleware/rateLimit");
const { requireAuth } = require("./middleware/auth");
const { getPool } = require("./db/index");
const { isMqttConectado } = require("./mqtt/client");
const { getTodasZonas } = require("./state/invernadero");

const app = express();

app.use(cors);
app.use(express.json());

app.get("/health", async (_req, res) => {
  const zonas = getTodasZonas();
  const conectadas = Object.values(zonas).filter((z) => z.conectado).length;

  const checks = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime_segundos: Math.floor(process.uptime()),
    servicios: {
      mqtt: isMqttConectado() ? "ok" : "error",
      db: "ok",
      zonas_activas: conectadas,
    },
  };

  const pool = getPool();
  if (!pool) {
    checks.servicios.db = "error";
    checks.status = "degradado";
  } else {
    try {
      await pool.query("SELECT 1");
    } catch {
      checks.servicios.db = "error";
      checks.status = "degradado";
    }
  }

  if (checks.servicios.mqtt === "error") {
    checks.status = "degradado";
  }

  res.status(checks.status === "ok" ? 200 : 503).json(checks);
});

app.get("/", (_req, res) => {
  res.json({
    servicio: "Invernadero IoT — API",
    mensaje: "Backend activo. UI en Vite (desarrollo).",
    frontend_dev: process.env.FRONTEND_URL || "http://localhost:5173",
    health: "/health",
    auth: "POST /api/auth/login",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", apiLimiter);
app.use("/api/admin", adminRoutes);
app.use("/api", requireAuth, apiRoutes);
registrarFrontend(app);

module.exports = app;
