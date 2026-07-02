const { Pool } = require("pg");

let pool = null;
let dbDisponible = false;

function initPool() {
  if (!process.env.DB_HOST || !process.env.DB_NAME) {
    console.warn("[DB] Variables de entorno no configuradas — historial deshabilitado");
    return null;
  }

  try {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
    });

    pool.on("error", (err) => {
      console.error("[DB] Error inesperado en el pool:", err.message);
      dbDisponible = false;
    });

    return pool;
  } catch (err) {
    console.error("[DB] No se pudo crear el pool:", err.message);
    return null;
  }
}

async function verificarConexion() {
  if (!pool) {
    return false;
  }

  try {
    await pool.query("SELECT 1");
    dbDisponible = true;
    console.log("[DB] Conectado a PostgreSQL");
    return true;
  } catch (err) {
    dbDisponible = false;
    console.error("[DB] PostgreSQL no disponible:", err.message);
    return false;
  }
}

function getPool() {
  return dbDisponible ? pool : null;
}

function isDbDisponible() {
  return dbDisponible;
}

module.exports = { initPool, verificarConexion, getPool, isDbDisponible };
