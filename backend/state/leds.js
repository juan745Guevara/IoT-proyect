const { ESTADO_INICIAL } = require("../config");

const estadoLeds = { ...ESTADO_INICIAL };

function getEstado() {
  return { ...estadoLeds };
}

function setLed(led, estado) {
  estadoLeds[led] = estado;
}

module.exports = { getEstado, setLed };
