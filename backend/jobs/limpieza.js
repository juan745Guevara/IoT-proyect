const { RETENCION_DIAS } = require("../config");
const { limpiarAntiguas } = require("../db/historial");

const INTERVALO_MS = 24 * 60 * 60 * 1000;

async function ejecutarLimpieza() {
  const eliminados = await limpiarAntiguas(RETENCION_DIAS);
  if (eliminados > 0) {
    console.log(`[Limpieza] ${eliminados} registro(s) eliminado(s) (>${RETENCION_DIAS} días)`);
  }
}

function iniciarLimpieza() {
  ejecutarLimpieza().catch((err) => {
    console.error("[Limpieza] Error en ejecución inicial:", err.message);
  });

  setInterval(() => {
    ejecutarLimpieza().catch((err) => {
      console.error("[Limpieza] Error en ejecución programada:", err.message);
    });
  }, INTERVALO_MS);

  console.log(`[Limpieza] Job programado cada 24h (retención: ${RETENCION_DIAS} días)`);
}

module.exports = { iniciarLimpieza };
