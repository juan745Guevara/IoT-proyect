const fs = require("fs");
const path = require("path");
const { getPool } = require("./index");

async function runSqlFile(filename) {
  const pool = getPool();
  if (!pool) {
    return;
  }
  const sql = fs.readFileSync(path.join(__dirname, filename), "utf8");
  await pool.query(sql);
}

async function initSchema() {
  const pool = getPool();
  if (!pool) {
    return;
  }

  try {
    await runSqlFile("schema.sql");
    await runSqlFile("migrations.sql");
    await runSqlFile("schema-auth.sql");
    console.log("[DB] Esquema verificado");
  } catch (err) {
    console.error("[DB] Error al aplicar esquema:", err.message);
  }
}

const SENSORES_COLUMNAS = {
  temperatura: "temperatura",
  humedad_aire: "humedad_aire",
  humedad_suelo: "humedad_suelo",
  luminosidad: "luminosidad",
};

async function insertarLectura(zona_id, datos) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `INSERT INTO lecturas_sensores (zona_id, temperatura, humedad_aire, humedad_suelo, luminosidad)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, timestamp`,
      [
        zona_id,
        datos.temperatura,
        datos.humedad_aire,
        datos.humedad_suelo,
        datos.luminosidad,
      ]
    );
    return result.rows[0];
  } catch (err) {
    console.error("[DB] Error al insertar lectura:", err.message);
    return null;
  }
}

async function obtenerHistorial({ zona_id, limite = 50, offset = 0 } = {}) {
  const pool = getPool();
  if (!pool) {
    return { filas: [], total: 0 };
  }

  try {
    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM lecturas_sensores WHERE zona_id = $1",
      [zona_id]
    );
    const total = countResult.rows[0]?.total ?? 0;

    const result = await pool.query(
      `SELECT id, zona_id, temperatura, humedad_aire, humedad_suelo, luminosidad, timestamp
       FROM lecturas_sensores
       WHERE zona_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [zona_id, limite, offset]
    );

    return { filas: result.rows, total };
  } catch (err) {
    console.error("[DB] Error al obtener historial:", err.message);
    return { filas: [], total: 0 };
  }
}

async function obtenerHistorialAgregado({ zona_id, sensor, rango }) {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  const columna = SENSORES_COLUMNAS[sensor];
  if (!columna) {
    return [];
  }

  const trunc = rango === "24h" ? "hour" : "day";
  const intervalo = rango === "24h" ? "24 hours" : rango === "7d" ? "7 days" : "30 days";

  try {
    const result = await pool.query(
      `SELECT DATE_TRUNC($1, timestamp) AS timestamp, AVG(${columna})::numeric AS valor
       FROM lecturas_sensores
       WHERE zona_id = $2
         AND timestamp >= NOW() - $3::interval
       GROUP BY DATE_TRUNC($1, timestamp)
       ORDER BY timestamp ASC`,
      [trunc, zona_id, intervalo]
    );

    return result.rows.map((row) => ({
      timestamp: row.timestamp,
      valor: Number(row.valor),
    }));
  } catch (err) {
    console.error("[DB] Error al obtener historial agregado:", err.message);
    return [];
  }
}

async function limpiarAntiguas(dias) {
  const pool = getPool();
  if (!pool) {
    return 0;
  }

  try {
    const result = await pool.query(
      `DELETE FROM lecturas_sensores
       WHERE timestamp < NOW() - ($1 || ' days')::interval`,
      [String(dias)]
    );
    return result.rowCount ?? 0;
  } catch (err) {
    console.error("[DB] Error al limpiar registros antiguos:", err.message);
    return 0;
  }
}

module.exports = {
  initSchema,
  insertarLectura,
  obtenerHistorial,
  obtenerHistorialAgregado,
  limpiarAntiguas,
};
