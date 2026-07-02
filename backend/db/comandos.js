const { getPool } = require("./index");

async function encolarComando({ zona_id, actuador, estado, origen }) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `INSERT INTO comandos_pendientes (zona_id, actuador, estado, origen)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [zona_id, actuador, estado, origen]
    );
    return result.rows[0];
  } catch (err) {
    console.error("[Queue] Error al encolar:", err.message);
    return null;
  }
}

async function obtenerPendientes(zona_id) {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  const result = await pool.query(
    `SELECT * FROM comandos_pendientes
     WHERE procesado = false AND zona_id = $1
     ORDER BY creado_en ASC`,
    [zona_id]
  );
  return result.rows;
}

async function obtenerTodosPendientes() {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  const result = await pool.query(
    `SELECT * FROM comandos_pendientes WHERE procesado = false ORDER BY creado_en ASC`
  );
  return result.rows;
}

async function marcarProcesado(id) {
  const pool = getPool();
  if (!pool) {
    return;
  }

  await pool.query("UPDATE comandos_pendientes SET procesado = true WHERE id = $1", [id]);
}

async function incrementarIntento(id) {
  const pool = getPool();
  if (!pool) {
    return;
  }

  await pool.query(
    "UPDATE comandos_pendientes SET intentos = intentos + 1 WHERE id = $1",
    [id]
  );
}

module.exports = {
  encolarComando,
  obtenerPendientes,
  obtenerTodosPendientes,
  marcarProcesado,
  incrementarIntento,
};
