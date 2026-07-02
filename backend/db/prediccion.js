const { getPool } = require("./index");

const COLUMNAS = {
  temperatura: "temperatura",
  humedad_aire: "humedad_aire",
  humedad_suelo: "humedad_suelo",
  luminosidad: "luminosidad",
};

async function prediccionHoraria(zona_id, sensor) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const col = COLUMNAS[sensor];
  if (!col) {
    return null;
  }

  const hora = new Date().getHours();

  try {
    const [actual, porHora] = await Promise.all([
      pool.query(
        `SELECT ROUND(AVG(${col})::numeric, 2) AS valor_esperado, COUNT(*)::int AS muestras
         FROM lecturas_sensores
         WHERE zona_id = $1
           AND EXTRACT(HOUR FROM timestamp) = $2
           AND timestamp >= NOW() - INTERVAL '30 days'`,
        [zona_id, hora]
      ),
      pool.query(
        `SELECT EXTRACT(HOUR FROM timestamp)::int AS hora,
                ROUND(AVG(${col})::numeric, 2) AS valor_esperado,
                ROUND(STDDEV(${col})::numeric, 2) AS desviacion,
                COUNT(*)::int AS muestras
         FROM lecturas_sensores
         WHERE zona_id = $1 AND timestamp >= NOW() - INTERVAL '30 days'
         GROUP BY EXTRACT(HOUR FROM timestamp)
         ORDER BY hora`,
        [zona_id]
      ),
    ]);

    const row = actual.rows[0];
    const mapaHora = Object.fromEntries(
      porHora.rows.map((r) => [r.hora, r])
    );
    const por_hora = Array.from({ length: 24 }, (_, h) => ({
      hora: h,
      valor_esperado: mapaHora[h]?.valor_esperado ?? null,
      desviacion: mapaHora[h]?.desviacion ?? null,
      muestras: mapaHora[h]?.muestras ?? 0,
    }));

    return {
      zona_id,
      sensor,
      hora_actual: hora,
      valor_esperado: row?.valor_esperado ?? null,
      muestras: row?.muestras ?? 0,
      por_hora,
      mensaje:
        row?.muestras > 0
          ? `A esta hora (${hora}:00) normalmente ${sensor} ≈ ${row.valor_esperado}`
          : "Sin datos históricos suficientes",
    };
  } catch (err) {
    console.error("[DB] Error predicción:", err.message);
    return null;
  }
}

module.exports = { prediccionHoraria };
