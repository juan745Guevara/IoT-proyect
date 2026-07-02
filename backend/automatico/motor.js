const { getConfig } = require("../state/automatico");
const { getActuadores } = require("../state/invernadero");
const { accionarActuador } = require("./acciones");

const ACTUADORES = ["ventilador", "bomba"];

function cumpleCondicion(valor, operador, umbral) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return false;
  }
  const v = Number(valor);
  const u = Number(umbral);

  switch (operador) {
    case ">=":
      return v >= u;
    case "<=":
      return v <= u;
    case "<":
      return v < u;
    case ">":
      return v > u;
    default:
      return false;
  }
}

async function evaluarAutomatico(zona_id, sensores) {
  const config = getConfig(zona_id);
  const actuadores = getActuadores(zona_id);

  for (const id of ACTUADORES) {
    const cfg = config[id];
    if (!cfg || cfg.modo !== "automatico") {
      continue;
    }

    const estadoActual = actuadores[id];
    const valorActivar = sensores[cfg.activar_si.sensor];
    const valorDesactivar = sensores[cfg.desactivar_si.sensor];

    const debeActivar = cumpleCondicion(
      valorActivar,
      cfg.activar_si.operador,
      cfg.activar_si.valor
    );
    const debeDesactivar = cumpleCondicion(
      valorDesactivar,
      cfg.desactivar_si.operador,
      cfg.desactivar_si.valor
    );

    try {
      if (debeDesactivar && estadoActual === "ON") {
        await accionarActuador(zona_id, id, "OFF", "automatico", {
          sensor: cfg.desactivar_si.sensor,
          valor: valorDesactivar,
        });
      } else if (debeActivar && estadoActual === "OFF") {
        await accionarActuador(zona_id, id, "ON", "automatico", {
          sensor: cfg.activar_si.sensor,
          valor: valorActivar,
        });
      }
    } catch (err) {
      console.error(`[AUTO] Error al accionar ${id} en ${zona_id}:`, err.message);
    }
  }
}

module.exports = { evaluarAutomatico, cumpleCondicion };
