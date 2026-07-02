const { obtenerZonas } = require("../db/zonas");
const { getTodasZonas } = require("../state/invernadero");
const { emitEstadoZonas } = require("../socket");

function estadoVacio() {
  return {
    sensores: { temperatura: null, humedad_aire: null, humedad_suelo: null, luminosidad: null },
    actuadores: { ventilador: "OFF", bomba: "OFF" },
    ultima_lectura: null,
    conectado: false,
  };
}

async function construirEstadoZonas() {
  const dbZonas = await obtenerZonas();
  const memoria = getTodasZonas();

  return dbZonas.map((z) => ({
    ...z,
    estado: memoria[z.id] || estadoVacio(),
  }));
}

async function emitirEstadoZonas() {
  const zonas = await construirEstadoZonas();
  emitEstadoZonas(zonas);
  return zonas;
}

module.exports = { construirEstadoZonas, emitirEstadoZonas, estadoVacio };
