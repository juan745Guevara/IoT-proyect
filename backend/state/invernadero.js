const { ESTADO_INICIAL_ACTUADORES } = require("../config");

const ZONA_DEFAULT = "zona1";
const zonas = {};

function estadoInicial() {
  return {
    sensores: {
      temperatura: null,
      humedad_aire: null,
      humedad_suelo: null,
      luminosidad: null,
    },
    actuadores: { ...ESTADO_INICIAL_ACTUADORES },
    ultima_lectura: null,
    conectado: false,
  };
}

function registrarZona(zona_id) {
  if (!zonas[zona_id]) {
    zonas[zona_id] = estadoInicial();
  }
  return zonas[zona_id];
}

function getZona(zona_id) {
  const z = registrarZona(zona_id);
  return {
    sensores: {
      ...z.sensores,
      ultima_lectura: z.ultima_lectura,
    },
    actuadores: { ...z.actuadores },
    ultima_lectura: z.ultima_lectura,
    conectado: z.conectado,
  };
}

function getTodasZonas() {
  const resultado = {};
  for (const id of Object.keys(zonas)) {
    resultado[id] = getZona(id);
  }
  return resultado;
}

function setZona(zona_id, datos) {
  const z = registrarZona(zona_id);

  if (datos.sensores) {
    z.sensores = {
      ...z.sensores,
      temperatura: datos.sensores.temperatura ?? z.sensores.temperatura,
      humedad_aire: datos.sensores.humedad_aire ?? z.sensores.humedad_aire,
      humedad_suelo: datos.sensores.humedad_suelo ?? z.sensores.humedad_suelo,
      luminosidad: datos.sensores.luminosidad ?? z.sensores.luminosidad,
    };
    z.ultima_lectura = datos.ultima_lectura ?? new Date().toISOString();
    z.conectado = true;
  }

  if (datos.actuadores) {
    z.actuadores = { ...z.actuadores, ...datos.actuadores };
  }

  if (datos.ultima_lectura !== undefined) {
    z.ultima_lectura = datos.ultima_lectura;
  }

  if (datos.conectado !== undefined) {
    z.conectado = datos.conectado;
  }
}

function setActuador(zona_id, actuador, estado) {
  registrarZona(zona_id).actuadores[actuador] = estado;
}

function getSensores(zona_id = ZONA_DEFAULT) {
  return getZona(zona_id).sensores;
}

function setSensores(zona_id, data) {
  setZona(zona_id, {
    sensores: data,
    ultima_lectura: new Date().toISOString(),
  });
}

function getActuadores(zona_id = ZONA_DEFAULT) {
  return getZona(zona_id).actuadores;
}

module.exports = {
  ZONA_DEFAULT,
  registrarZona,
  getZona,
  getTodasZonas,
  setZona,
  setActuador,
  getSensores,
  setSensores,
  getActuadores,
};
