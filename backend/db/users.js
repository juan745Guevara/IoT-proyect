const bcrypt = require("bcryptjs");
const { getPool } = require("./index");

const ROLES = ["admin", "lectura"];
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

async function initUsuarios() {
  const pool = getPool();
  if (!pool) {
    return;
  }

  const usuario = process.env.ADMIN_USER || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  try {
    const existe = await pool.query("SELECT id FROM usuarios WHERE usuario = $1", [usuario]);
    if (existe.rows.length > 0) {
      return;
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await pool.query(
      "INSERT INTO usuarios (usuario, password_hash, rol) VALUES ($1, $2, 'admin')",
      [usuario, hash]
    );
    console.log(`[Auth] Usuario admin creado: ${usuario}`);
  } catch (err) {
    console.error("[Auth] Error al inicializar usuarios:", err.message);
  }
}

async function autenticar(usuario, password) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(
    "SELECT id, usuario, password_hash, rol FROM usuarios WHERE usuario = $1 AND activo = true",
    [usuario]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    return null;
  }

  await pool.query("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1", [row.id]).catch(() => {});

  return { id: row.id, usuario: row.usuario, rol: row.rol };
}

async function obtenerPorId(id) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(
    "SELECT id, usuario, rol, activo, creado_en FROM usuarios WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

async function listarUsuarios() {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  const result = await pool.query(
    "SELECT id, usuario, rol, activo, creado_en FROM usuarios ORDER BY id"
  );
  return result.rows;
}

async function crearUsuario({ usuario, password, rol }) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  if (!ROLES.includes(rol)) {
    throw new Error("rol inválido");
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await pool.query(
    "INSERT INTO usuarios (usuario, password_hash, rol) VALUES ($1, $2, $3) RETURNING id, usuario, rol, activo, creado_en",
    [usuario, hash, rol]
  );
  return result.rows[0];
}

async function actualizarUsuario(id, { rol, activo }) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(
    "UPDATE usuarios SET rol = COALESCE($2, rol), activo = COALESCE($3, activo) WHERE id = $1 RETURNING id, usuario, rol, activo, creado_en",
    [id, rol ?? null, activo ?? null]
  );
  return result.rows[0] || null;
}

async function desactivarUsuario(id) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(
    "UPDATE usuarios SET activo = false WHERE id = $1 RETURNING id, usuario, rol, activo, creado_en",
    [id]
  );
  return result.rows[0] || null;
}

async function cambiarPassword(id, passwordActual, passwordNuevo) {
  const pool = getPool();
  if (!pool) {
    return false;
  }

  const result = await pool.query("SELECT password_hash FROM usuarios WHERE id = $1", [id]);
  const row = result.rows[0];
  if (!row) {
    return false;
  }

  const ok = await bcrypt.compare(passwordActual, row.password_hash);
  if (!ok) {
    return false;
  }

  const hash = await bcrypt.hash(passwordNuevo, BCRYPT_ROUNDS);
  await pool.query("UPDATE usuarios SET password_hash = $2 WHERE id = $1", [id, hash]);
  return true;
}

module.exports = {
  initUsuarios,
  autenticar,
  obtenerPorId,
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  desactivarUsuario,
  cambiarPassword,
  ROLES,
};
