const { getPool } = require("./index");

async function crearRiego({ zona_id, actuador, hora, duracion_minutos, dias_semana }) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `INSERT INTO riegos_programados (zona_id, actuador, hora, duracion_minutos, dias_semana)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [zona_id, actuador, hora, duracion_minutos, dias_semana]
    );
    return result.rows[0];
  } catch (err) {
    console.error("[DB] Error al crear riego:", err.message);
    return null;
  }
}

async function obtenerRiegosPorZona(zona_id) {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  try {
    const result = await pool.query(
      `SELECT * FROM riegos_programados
       WHERE zona_id = $1 AND activo = true
       ORDER BY hora ASC`,
      [zona_id]
    );
    return result.rows;
  } catch (err) {
    console.error("[DB] Error al obtener riegos:", err.message);
    return [];
  }
}

async function obtenerTodosRiegosActivos() {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  try {
    const result = await pool.query(
      `SELECT * FROM riegos_programados WHERE activo = true ORDER BY zona_id, hora`
    );
    return result.rows;
  } catch (err) {
    console.error("[DB] Error al obtener riegos activos:", err.message);
    return [];
  }
}

async function actualizarRiego(id, datos) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const campos = [];
  const valores = [];
  let i = 1;

  for (const key of ["actuador", "hora", "duracion_minutos", "dias_semana", "activo"]) {
    if (datos[key] !== undefined) {
      campos.push(`${key} = $${i++}`);
      valores.push(datos[key]);
    }
  }

  if (campos.length === 0) {
    return null;
  }

  valores.push(id);

  try {
    const result = await pool.query(
      `UPDATE riegos_programados SET ${campos.join(", ")} WHERE id = $${i} RETURNING *`,
      valores
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("[DB] Error al actualizar riego:", err.message);
    return null;
  }
}

async function eliminarRiego(id) {
  return actualizarRiego(id, { activo: false });
}

module.exports = {
  crearRiego,
  obtenerRiegosPorZona,
  obtenerTodosRiegosActivos,
  actualizarRiego,
  eliminarRiego,
};
