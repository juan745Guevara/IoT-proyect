const { setActuador, getActuadores, getZona } = require("../state/invernadero");
const { emitActuadores, emitLogAccion } = require("../socket");
const { insertarLog } = require("../db/log");
const { encolarSiDesconectado, publicarComandoSeguro } = require("../queue/comandos");

function unidadSensor(sensor) {
  return sensor === "temperatura" ? "°C" : "%";
}

function accionarActuador(zona_id, actuador, estado, origen, meta = {}) {
  return new Promise(async (resolve, reject) => {
    const { sensor, valor } = meta;

    try {
      const encolado = await encolarSiDesconectado(zona_id, actuador, estado, origen);
      if (encolado) {
        console.log(`[Queue] ${zona_id}/${actuador}→${estado} encolado (${origen})`);
        return resolve({ encolado: true });
      }

      publicarComandoSeguro(zona_id, actuador, estado, async (err) => {
        if (err) {
          const { encolarComando } = require("../db/comandos");
          await encolarComando({ zona_id, actuador, estado, origen });
          return reject(err);
        }

        setActuador(zona_id, actuador, estado);
        emitActuadores(zona_id, getActuadores(zona_id));

        const prefijo =
          origen === "automatico" ? "[AUTO]" : origen === "programado" ? "[RIEGO]" : "[MANUAL]";
        if (sensor !== undefined && valor !== undefined) {
          const u = unidadSensor(sensor);
          const v = sensor === "temperatura" ? Number(valor).toFixed(1) : Math.round(valor);
          console.log(`${prefijo} ${zona_id}/${actuador} → ${estado} (${sensor}: ${v}${u})`);
        } else {
          console.log(`${prefijo} ${zona_id}/${actuador} → ${estado}`);
        }

        try {
          const entrada = await insertarLog({
            zona_id,
            actuador,
            estado,
            origen,
            sensor_disparador: sensor ?? null,
            valor_sensor: valor ?? null,
          });
          if (entrada) {
            emitLogAccion(entrada);
          }
        } catch (logErr) {
          console.error("[LOG] Error al registrar acción:", logErr.message);
        }

        resolve({ encolado: false });
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { accionarActuador, unidadSensor };
