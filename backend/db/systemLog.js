const { getPool } = require("./index");

async function registrarLog(nivel, modulo, mensaje) {
  const pool = getPool();
  if (!pool) {
    console.log(`[${nivel}] [${modulo}] ${mensaje}`);
    return;
  }

  try {
    await pool.query(
      "INSERT INTO system_logs (nivel, modulo, mensaje) VALUES ($1, $2, $3)",
      [nivel, modulo, mensaje]
    );
  } catch {
    console.log(`[${nivel}] [${modulo}] ${mensaje}`);
  }
}

async function obtenerLogs({ limite = 100 } = {}) {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  const result = await pool.query(
    "SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT $1",
    [limite]
  );
  return result.rows;
}

module.exports = { registrarLog, obtenerLogs };
