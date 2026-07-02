const { ZONA_DEFAULT } = require("./invernadero");

const CONFIG_INICIAL = {
  ventilador: {
    modo: "manual",
    activar_si: { sensor: "temperatura", operador: ">=", valor: 36 },
    desactivar_si: { sensor: "temperatura", operador: "<", valor: 33 },
  },
  bomba: {
    modo: "manual",
    activar_si: { sensor: "humedad_suelo", operador: "<=", valor: 30 },
    desactivar_si: { sensor: "humedad_suelo", operador: ">", valor: 40 },
  },
};

const configPorZona = {};

function asegurarZona(zona_id) {
  if (!configPorZona[zona_id]) {
    configPorZona[zona_id] = JSON.parse(JSON.stringify(CONFIG_INICIAL));
  }
  return configPorZona[zona_id];
}

function getConfig(zona_id = ZONA_DEFAULT) {
  return JSON.parse(JSON.stringify(asegurarZona(zona_id)));
}

function getConfigActuador(zona_id, actuador) {
  const config = asegurarZona(zona_id);
  if (!config[actuador]) {
    return null;
  }
  return JSON.parse(JSON.stringify(config[actuador]));
}

function setConfigActuador(zona_id, actuador, nuevaConfig) {
  const config = asegurarZona(zona_id);
  if (!config[actuador]) {
    return null;
  }
  const actual = config[actuador];
  config[actuador] = {
    modo: nuevaConfig.modo ?? actual.modo,
    activar_si: nuevaConfig.activar_si
      ? { ...actual.activar_si, ...nuevaConfig.activar_si }
      : actual.activar_si,
    desactivar_si: nuevaConfig.desactivar_si
      ? { ...actual.desactivar_si, ...nuevaConfig.desactivar_si }
      : actual.desactivar_si,
  };
  return getConfigActuador(zona_id, actuador);
}

function setModo(zona_id, actuador, modo) {
  const config = asegurarZona(zona_id);
  if (!config[actuador]) {
    return null;
  }
  config[actuador].modo = modo;
  return getConfigActuador(zona_id, actuador);
}

module.exports = {
  getConfig,
  getConfigActuador,
  setConfigActuador,
  setModo,
  CONFIG_INICIAL,
};
