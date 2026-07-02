const { getPool } = require("./index");

async function insertarAnomalia({ zona_id, sensor, valor_anterior, valor_actual, delta }) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `INSERT INTO anomalias (zona_id, sensor, valor_anterior, valor_actual, delta)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [zona_id, sensor, valor_anterior, valor_actual, delta]
    );
    return result.rows[0];
  } catch (err) {
    console.error("[DB] Error al insertar anomalía:", err.message);
    return null;
  }
}

async function listarAnomalias({ zona_id, limite = 20 }) {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  const cap = Math.min(parseInt(limite, 10) || 20, 100);

  try {
    const result = await pool.query(
      `SELECT * FROM anomalias
       WHERE zona_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [zona_id, cap]
    );
    return result.rows;
  } catch (err) {
    console.error("[DB] Error al listar anomalías:", err.message);
    return [];
  }
}

module.exports = { insertarAnomalia, listarAnomalias };
