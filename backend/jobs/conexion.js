const { CONEXION_TIMEOUT_MS } = require("../config");
const { getTodasZonas, setZona, registrarZona } = require("../state/invernadero");
const { emitirEstadoZonas } = require("../helpers/zonasEstado");

let intervalo = null;

function iniciarMonitoreoConexion() {
  if (intervalo) {
    return;
  }

  intervalo = setInterval(() => {
    const zonas = getTodasZonas();
    let cambio = false;
    const ahora = Date.now();

    for (const [zona_id, estado] of Object.entries(zonas)) {
      if (!estado.ultima_lectura) {
        continue;
      }

      const ms = ahora - new Date(estado.ultima_lectura).getTime();
      const deberiaEstarConectado = ms < CONEXION_TIMEOUT_MS;

      if (estado.conectado !== deberiaEstarConectado) {
        registrarZona(zona_id);
        setZona(zona_id, { conectado: deberiaEstarConectado });
        cambio = true;
      }
    }

    if (cambio) {
      emitirEstadoZonas().catch((err) => {
        console.error("[Conexion] Error al emitir estado:", err.message);
      });
    }
  }, 5000);

  console.log("[Conexion] Monitoreo de zonas cada 5s");
}

module.exports = { iniciarMonitoreoConexion };
