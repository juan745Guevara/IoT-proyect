const { getPool } = require("./index");

async function estadisticasSemanales(zona_id) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `SELECT
         'temperatura' AS sensor,
         ROUND(AVG(temperatura)::numeric, 2) AS promedio,
         ROUND(MAX(temperatura)::numeric, 2) AS maximo,
         ROUND(MIN(temperatura)::numeric, 2) AS minimo
       FROM lecturas_sensores
       WHERE zona_id = $1 AND timestamp >= NOW() - INTERVAL '7 days'
       UNION ALL
       SELECT 'humedad_aire', ROUND(AVG(humedad_aire)::numeric, 2),
              ROUND(MAX(humedad_aire)::numeric, 2), ROUND(MIN(humedad_aire)::numeric, 2)
       FROM lecturas_sensores WHERE zona_id = $1 AND timestamp >= NOW() - INTERVAL '7 days'
       UNION ALL
       SELECT 'humedad_suelo', ROUND(AVG(humedad_suelo)::numeric, 2),
              ROUND(MAX(humedad_suelo)::numeric, 2), ROUND(MIN(humedad_suelo)::numeric, 2)
       FROM lecturas_sensores WHERE zona_id = $1 AND timestamp >= NOW() - INTERVAL '7 days'
       UNION ALL
       SELECT 'luminosidad', ROUND(AVG(luminosidad)::numeric, 2),
              ROUND(MAX(luminosidad)::numeric, 2), ROUND(MIN(luminosidad)::numeric, 2)
       FROM lecturas_sensores WHERE zona_id = $1 AND timestamp >= NOW() - INTERVAL '7 days'`,
      [zona_id]
    );
    return result.rows;
  } catch (err) {
    console.error("[DB] Error estadísticas semanales:", err.message);
    return [];
  }
}

async function estadisticasPorSemana(zona_id) {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  try {
    const result = await pool.query(
      `SELECT
         DATE_TRUNC('week', timestamp) AS semana,
         ROUND(AVG(temperatura)::numeric, 2) AS temp_avg,
         ROUND(MAX(temperatura)::numeric, 2) AS temp_max,
         ROUND(MIN(temperatura)::numeric, 2) AS temp_min,
         ROUND(AVG(humedad_aire)::numeric, 2) AS haire_avg,
         ROUND(MAX(humedad_aire)::numeric, 2) AS haire_max,
         ROUND(MIN(humedad_aire)::numeric, 2) AS haire_min,
         ROUND(AVG(humedad_suelo)::numeric, 2) AS hsuelo_avg,
         ROUND(MAX(humedad_suelo)::numeric, 2) AS hsuelo_max,
         ROUND(MIN(humedad_suelo)::numeric, 2) AS hsuelo_min,
         ROUND(AVG(luminosidad)::numeric, 2) AS luz_avg,
         ROUND(MAX(luminosidad)::numeric, 2) AS luz_max,
         ROUND(MIN(luminosidad)::numeric, 2) AS luz_min
       FROM lecturas_sensores
       WHERE zona_id = $1 AND timestamp >= NOW() - INTERVAL '8 weeks'
       GROUP BY DATE_TRUNC('week', timestamp)
       ORDER BY semana DESC`,
      [zona_id]
    );
    return result.rows;
  } catch (err) {
    console.error("[DB] Error estadísticas por semana:", err.message);
    return [];
  }
}

module.exports = { estadisticasSemanales, estadisticasPorSemana };
