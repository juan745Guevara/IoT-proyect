const { ESTADO_INICIAL_ACTUADORES } = require("../config");

let sensores = {
  temperatura: null,
  humedad_aire: null,
  humedad_suelo: null,
  luminosidad: null,
  ultima_lectura: null,
};

let actuadores = { ...ESTADO_INICIAL_ACTUADORES };

function getSensores() {
  return { ...sensores };
}

function setSensores(data) {
  sensores = {
    ...sensores,
    temperatura: data.temperatura ?? sensores.temperatura,
    humedad_aire: data.humedad_aire ?? sensores.humedad_aire,
    humedad_suelo: data.humedad_suelo ?? sensores.humedad_suelo,
    luminosidad: data.luminosidad ?? sensores.luminosidad,
    ultima_lectura: new Date().toISOString(),
  };
}

function getActuadores() {
  return { ...actuadores };
}

function setActuador(actuador, estado) {
  actuadores[actuador] = estado;
}

module.exports = { getSensores, setSensores, getActuadores, setActuador };
