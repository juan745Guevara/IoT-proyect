const { insertarAlerta } = require("../db/alertas");
const { insertarAnomalia } = require("../db/anomalias");
const { emitAlerta, emitAnomalia } = require("../socket");

const ventanas = {};
const conexionZona = {};
const cooldowns = {};

const UMBRALES = {
  temperatura: Number(process.env.ANOMALIA_TEMP_DELTA) || 5,
  humedad_aire: Number(process.env.ANOMALIA_HAIRE_DELTA) || 20,
  humedad_suelo: Number(process.env.ANOMALIA_HSUELO_DELTA) || 30,
};

const VENTANA_MS = Number(process.env.ANOMALIA_VENTANA_MS) || 2 * 60 * 1000;
const COOLDOWN_MS = Number(process.env.ANOMALIA_COOLDOWN_MS) || 5 * 60 * 1000;
const GRACIA_CONEXION_MS = 2 * 60 * 1000;
const MAX_LECTURAS = 3;

function registrarConexion(zona_id) {
  if (!conexionZona[zona_id]) {
    conexionZona[zona_id] = Date.now();
    ventanas[zona_id] = [];
  }
}

function enGraciaConexion(zona_id) {
  const inicio = conexionZona[zona_id];
  return inicio && Date.now() - inicio < GRACIA_CONEXION_MS;
}

function enCooldown(zona_id, sensor) {
  const key = `${zona_id}:${sensor}`;
  const hasta = cooldowns[key];
  return hasta && Date.now() < hasta;
}

function activarCooldown(zona_id, sensor) {
  cooldowns[`${zona_id}:${sensor}`] = Date.now() + COOLDOWN_MS;
}

async function reportarAnomalia(zona_id, sensor, valorAnterior, valorActual, delta) {
  const mensaje = `${sensor}: cambio de ${Math.abs(delta).toFixed(1)} en menos de 2 min`;
  const umbral = UMBRALES[sensor];

  const registro = await insertarAnomalia({
    zona_id,
    sensor,
    valor_anterior: valorAnterior,
    valor_actual: valorActual,
    delta,
  });

  const alerta = await insertarAlerta({
    zona_id,
    tipo: "anomalia",
    sensor,
    mensaje,
    valor: valorActual,
    umbral,
  });

  const payload = {
    id: registro?.id ?? alerta?.id,
    zona_id,
    sensor,
    delta,
    mensaje,
    valor_anterior: valorAnterior,
    valor_actual: valorActual,
    timestamp: new Date().toISOString(),
  };

  emitAnomalia(payload);
  if (alerta) {
    emitAlerta(alerta);
  }
  console.warn(`[ANOMALIA] ${zona_id}: ${mensaje}`);
}

async function evaluarAnomalias(zona_id, sensores) {
  registrarConexion(zona_id);

  if (enGraciaConexion(zona_id)) {
    ventanas[zona_id].push({ timestamp: Date.now(), ...sensores });
    if (ventanas[zona_id].length > MAX_LECTURAS) {
      ventanas[zona_id].shift();
    }
    return;
  }

  const ahora = Date.now();
  const lista = ventanas[zona_id] || [];
  lista.push({ timestamp: ahora, ...sensores });
  if (lista.length > MAX_LECTURAS) {
    lista.shift();
  }
  ventanas[zona_id] = lista;

  if (lista.length < MAX_LECTURAS) {
    return;
  }

  const masAntigua = lista[0];
  const masReciente = lista[lista.length - 1];
  const deltaMs = masReciente.timestamp - masAntigua.timestamp;

  if (deltaMs > VENTANA_MS) {
    return;
  }

  for (const sensor of Object.keys(UMBRALES)) {
    const prev = masAntigua[sensor];
    const actual = masReciente[sensor];
    if (prev == null || actual == null) {
      continue;
    }

    const delta = Math.abs(Number(actual) - Number(prev));
    if (delta < UMBRALES[sensor]) {
      continue;
    }
    if (enCooldown(zona_id, sensor)) {
      continue;
    }

    activarCooldown(zona_id, sensor);
    await reportarAnomalia(zona_id, sensor, prev, actual, delta);
  }
}

module.exports = { evaluarAnomalias };
