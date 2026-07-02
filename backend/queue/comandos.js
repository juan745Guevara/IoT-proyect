const { getZona } = require("../state/invernadero");
const { encolarComando } = require("../db/comandos");
const { registrarLog } = require("../db/systemLog");
const { publicarComando, isMqttConectado, procesarColaPendientes } = require("../mqtt/client");

async function encolarSiDesconectado(zona_id, actuador, estado, origen) {
  const zona = getZona(zona_id);
  if (zona.conectado && isMqttConectado()) {
    return false;
  }

  await encolarComando({ zona_id, actuador, estado, origen });
  await registrarLog("warn", "queue", `Comando encolado ${zona_id}/${actuador}→${estado} (${origen})`);
  return true;
}

function publicarComandoSeguro(zona_id, actuador, estado, callback) {
  if (!isMqttConectado()) {
    return callback(new Error("MQTT desconectado"));
  }
  publicarComando(zona_id, actuador, estado, callback);
}

async function drenarCola() {
  await procesarColaPendientes();
}

module.exports = { encolarSiDesconectado, publicarComandoSeguro, drenarCola };
