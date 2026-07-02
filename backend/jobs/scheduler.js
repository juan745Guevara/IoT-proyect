const { obtenerTodosRiegosActivos } = require("../db/riegos");
const { accionarActuador } = require("../automatico/acciones");

const disparadosEsteMinuto = new Set();
let minutoActual = "";
let intervalo = null;
const timeoutsActivos = new Map();

function claveDisparo(riego) {
  const ahora = new Date();
  return `${riego.id}-${ahora.toISOString().slice(0, 16)}`;
}

function diaSemanaActual() {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

async function ejecutarRiego(riego) {
  const clave = claveDisparo(riego);
  if (disparadosEsteMinuto.has(clave)) {
    return;
  }
  disparadosEsteMinuto.add(clave);

  const timeoutKey = `${riego.zona_id}-${riego.actuador}-${riego.id}`;
  if (timeoutsActivos.has(timeoutKey)) {
    clearTimeout(timeoutsActivos.get(timeoutKey));
  }

  try {
    await accionarActuador(riego.zona_id, riego.actuador, "ON", "programado");

    const ms = riego.duracion_minutos * 60 * 1000;
    const timeoutId = setTimeout(() => {
      accionarActuador(riego.zona_id, riego.actuador, "OFF", "programado").catch((err) => {
        console.error("[RIEGO] Error al apagar:", err.message);
      });
      timeoutsActivos.delete(timeoutKey);
    }, ms);

    timeoutsActivos.set(timeoutKey, timeoutId);
    console.log(`[RIEGO] Programado ${riego.zona_id}/${riego.actuador} ON por ${riego.duracion_minutos}min`);
  } catch (err) {
    console.error("[RIEGO] Error al ejecutar:", err.message);
  }
}

async function revisarRiegos() {
  const ahora = new Date();
  const minutoStr = ahora.toISOString().slice(0, 16);

  if (minutoStr !== minutoActual) {
    disparadosEsteMinuto.clear();
    minutoActual = minutoStr;
  }

  const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  const dia = diaSemanaActual();

  const riegos = await obtenerTodosRiegosActivos();

  for (const riego of riegos) {
    if (!riego.dias_semana.includes(dia)) {
      continue;
    }

    const horaRiego = String(riego.hora).slice(0, 5);
    if (horaRiego === horaActual) {
      await ejecutarRiego(riego);
    }
  }
}

function iniciarScheduler() {
  if (intervalo) {
    return;
  }

  revisarRiegos().catch((err) => console.error("[RIEGO] Error inicial:", err.message));
  intervalo = setInterval(() => {
    revisarRiegos().catch((err) => console.error("[RIEGO] Error en scheduler:", err.message));
  }, 60 * 1000);

  console.log("[RIEGO] Scheduler programado cada 60s");
}

module.exports = { iniciarScheduler };
