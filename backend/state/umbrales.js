const { ZONA_DEFAULT } = require("./invernadero");

const UMBRALES_DEFAULT = {
  temperatura_max: 35,
  humedad_aire_min: 40,
  humedad_suelo_min: 30,
  luminosidad_min: 20,
};

const umbralesPorZona = {};

function asegurarZona(zona_id) {
  if (!umbralesPorZona[zona_id]) {
    umbralesPorZona[zona_id] = { ...UMBRALES_DEFAULT };
  }
  return umbralesPorZona[zona_id];
}

function getUmbrales(zona_id = ZONA_DEFAULT) {
  return { ...asegurarZona(zona_id) };
}

function setUmbrales(zona_id, nuevos) {
  const umbrales = asegurarZona(zona_id);
  Object.assign(umbrales, nuevos);
  return getUmbrales(zona_id);
}

module.exports = { getUmbrales, setUmbrales, UMBRALES_DEFAULT };
