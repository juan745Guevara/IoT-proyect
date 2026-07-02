const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { isDbDisponible } = require("../db/index");
const { registrarLog } = require("../db/systemLog");

const execFileAsync = promisify(execFile);
const MAX_BACKUPS = Number(process.env.BACKUP_RETENTION) || 7;

function backupDir() {
  return process.env.BACKUP_DIR || path.join(__dirname, "..", "backups");
}

function limpiarBackupsAntiguos(dir) {
  const archivos = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => ({
      nombre: f,
      ruta: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const viejo of archivos.slice(MAX_BACKUPS)) {
    fs.unlinkSync(viejo.ruta);
    console.log("[Backup] Eliminado backup antiguo:", viejo.nombre);
  }
}

async function ejecutarBackup() {
  if (!isDbDisponible()) {
    await registrarLog("error", "backup", "PostgreSQL no disponible");
    return { ok: false, error: "DB no disponible" };
  }

  const dir = backupDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const archivo = path.join(dir, `backup-${fecha}.sql`);

  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER || "postgres";
  const db = process.env.DB_NAME || "invernadero";

  try {
    await execFileAsync(
      "pg_dump",
      ["-h", host, "-p", String(port), "-U", user, "-d", db, "-f", archivo],
      { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || "" } }
    );
    const stat = fs.statSync(archivo);
    limpiarBackupsAntiguos(dir);
    await registrarLog("info", "backup", `Backup creado: ${archivo}`);
    console.log("[Backup] Archivo:", archivo);
    return {
      ok: true,
      archivo: path.basename(archivo),
      tamano_kb: Math.round(stat.size / 1024),
    };
  } catch (err) {
    await registrarLog("error", "backup", err.message);
    console.error("[Backup] Error:", err.message);
    return { ok: false, error: err.message };
  }
}

function listarBackups() {
  const dir = backupDir();
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => {
      const ruta = path.join(dir, f);
      const stat = fs.statSync(ruta);
      return {
        archivo: f,
        tamano_kb: Math.round(stat.size / 1024),
        fecha: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

function msHastaProximas2am() {
  const ahora = new Date();
  const proximo = new Date(ahora);
  proximo.setHours(2, 0, 0, 0);
  if (proximo <= ahora) {
    proximo.setDate(proximo.getDate() + 1);
  }
  return proximo.getTime() - ahora.getTime();
}

function iniciarBackup() {
  const programar = () => {
    const ms = msHastaProximas2am();
    setTimeout(() => {
      ejecutarBackup().catch(() => {});
      setInterval(() => {
        ejecutarBackup().catch(() => {});
      }, 24 * 60 * 60 * 1000);
    }, ms);
  };

  programar();
  console.log("[Backup] Job programado diariamente a las 2:00");
}

module.exports = { ejecutarBackup, iniciarBackup, listarBackups, backupDir };
