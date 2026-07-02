const { getPool } = require("./index");

async function obtenerZonas() {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  try {
    const result = await pool.query(
      `SELECT id, nombre, descripcion, activa, creada_en
       FROM zonas
       WHERE activa = true
       ORDER BY creada_en ASC`
    );
    return result.rows;
  } catch (err) {
    console.error("[DB] Error al obtener zonas:", err.message);
    return [];
  }
}

async function crearZona({ id, nombre, descripcion }) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `INSERT INTO zonas (id, nombre, descripcion)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, descripcion, activa, creada_en`,
      [id, nombre, descripcion || null]
    );
    return result.rows[0];
  } catch (err) {
    console.error("[DB] Error al crear zona:", err.message);
    throw err;
  }
}

async function actualizarZona(zona_id, { nombre, descripcion }) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `UPDATE zonas
       SET nombre = COALESCE($2, nombre),
           descripcion = COALESCE($3, descripcion)
       WHERE id = $1 AND activa = true
       RETURNING id, nombre, descripcion, activa, creada_en`,
      [zona_id, nombre, descripcion]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("[DB] Error al actualizar zona:", err.message);
    return null;
  }
}

async function desactivarZona(zona_id) {
  const pool = getPool();
  if (!pool) {
    return false;
  }

  try {
    const result = await pool.query(
      `UPDATE zonas SET activa = false WHERE id = $1 RETURNING id`,
      [zona_id]
    );
    return result.rowCount > 0;
  } catch (err) {
    console.error("[DB] Error al desactivar zona:", err.message);
    return false;
  }
}

module.exports = { obtenerZonas, crearZona, actualizarZona, desactivarZona };
