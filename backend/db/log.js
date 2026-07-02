const { getPool } = require("./index");

async function insertarLog({
  zona_id,
  actuador,
  estado,
  origen,
  sensor_disparador = null,
  valor_sensor = null,
}) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `INSERT INTO log_acciones (zona_id, actuador, estado, origen, sensor_disparador, valor_sensor)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [zona_id, actuador, estado, origen, sensor_disparador, valor_sensor]
    );
    return result.rows[0];
  } catch (err) {
    console.error("[DB] Error al insertar log:", err.message);
    return null;
  }
}

async function obtenerLog({ zona_id, limite = 50, offset = 0 }) {
  const pool = getPool();
  if (!pool) {
    return { filas: [], total: 0 };
  }

  try {
    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM log_acciones WHERE zona_id = $1",
      [zona_id]
    );
    const total = countResult.rows[0]?.total ?? 0;

    const result = await pool.query(
      `SELECT id, zona_id, actuador, estado, origen, sensor_disparador, valor_sensor, timestamp
       FROM log_acciones
       WHERE zona_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [zona_id, limite, offset]
    );

    return { filas: result.rows, total };
  } catch (err) {
    console.error("[DB] Error al obtener log:", err.message);
    return { filas: [], total: 0 };
  }
}

module.exports = { insertarLog, obtenerLog };
