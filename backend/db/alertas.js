const { getPool, isDbDisponible } = require("./index");

async function insertarAlerta({ zona_id, tipo, sensor, mensaje, valor, umbral }) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `INSERT INTO alertas (zona_id, tipo, sensor, mensaje, valor, umbral)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [zona_id, tipo, sensor, mensaje, valor, umbral]
    );
    return result.rows[0];
  } catch (err) {
    console.error("[DB] Error al insertar alerta:", err.message);
    return null;
  }
}

async function obtenerAlertas({ zona_id, limite = 50, pagina = 1, soloActivas = false }) {
  const pool = getPool();
  if (!pool) {
    return { filas: [], total: 0 };
  }

  const offset = (pagina - 1) * limite;
  const filtro = soloActivas ? "AND resuelta = false" : "";

  try {
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM alertas WHERE zona_id = $1 ${filtro}`,
      [zona_id]
    );
    const result = await pool.query(
      `SELECT * FROM alertas WHERE zona_id = $1 ${filtro}
       ORDER BY timestamp DESC LIMIT $2 OFFSET $3`,
      [zona_id, limite, offset]
    );
    return { filas: result.rows, total: count.rows[0]?.total ?? 0 };
  } catch (err) {
    console.error("[DB] Error al obtener alertas:", err.message);
    return { filas: [], total: 0 };
  }
}

async function resolverAlerta(id) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(
    "UPDATE alertas SET resuelta = true WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { insertarAlerta, obtenerAlertas, resolverAlerta, isDbDisponible };
