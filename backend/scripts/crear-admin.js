#!/usr/bin/env node
/**
 * Crear o actualizar usuario admin.
 * Uso: node backend/scripts/crear-admin.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const readline = require("readline");
const bcrypt = require("bcryptjs");
const { getPool } = require("../db/index");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function preguntar(texto) {
  return new Promise((resolve) => rl.question(texto, resolve));
}

async function main() {
  const pool = getPool();
  if (!pool) {
    console.error("No hay conexión a PostgreSQL. Revisa DB_* en .env");
    process.exit(1);
  }

  const usuario = (await preguntar("Usuario: ")).trim();
  const password = await preguntar("Contraseña (mín. 8 caracteres): ");

  if (!usuario || password.length < 8) {
    console.error("Usuario y contraseña (≥8 chars) requeridos.");
    process.exit(1);
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  const hash = await bcrypt.hash(password, rounds);

  const existe = await pool.query("SELECT id FROM usuarios WHERE usuario = $1", [usuario]);

  if (existe.rows.length > 0) {
    await pool.query(
      "UPDATE usuarios SET password_hash = $2, rol = 'admin', activo = true WHERE usuario = $1",
      [usuario, hash]
    );
    console.log(`Usuario '${usuario}' actualizado como admin.`);
  } else {
    await pool.query(
      "INSERT INTO usuarios (usuario, password_hash, rol) VALUES ($1, $2, 'admin')",
      [usuario, hash]
    );
    console.log(`Usuario admin '${usuario}' creado.`);
  }

  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
