const express = require("express");
const {
  ACTUADORES_VALIDOS,
  ESTADOS_VALIDOS,
  ZONA_DEFAULT,
  SENSORES_VALIDOS,
  RANGOS_HISTORIAL,
  validarZonaId,
} = require("../config");
const {
  getActuadores,
  getZona,
  registrarZona,
} = require("../state/invernadero");
const { getUmbrales, setUmbrales } = require("../state/umbrales");
const { getConfig, getConfigActuador, setConfigActuador, setModo } = require("../state/automatico");
const { validarConfigActuador, MODOS_VALIDOS } = require("../automatico/validar");
const { obtenerHistorial, obtenerHistorialAgregado } = require("../db/historial");
const { obtenerZonas, crearZona, actualizarZona, desactivarZona } = require("../db/zonas");
const { obtenerLog } = require("../db/log");
const {
  crearRiego,
  obtenerRiegosPorZona,
  actualizarRiego,
  eliminarRiego,
} = require("../db/riegos");
const { isDbDisponible } = require("../db/index");
const { accionarActuador } = require("../automatico/acciones");
const { requireWrite } = require("../middleware/auth");
const { actuadorLimiter } = require("../middleware/rateLimit");
const {
  emitUmbrales,
  emitAutomatico,
} = require("../socket");
const { obtenerAlertas, resolverAlerta } = require("../db/alertas");
const { estadisticasSemanales, estadisticasPorSemana } = require("../db/estadisticas");
const { prediccionHoraria } = require("../db/prediccion");
const { listarAnomalias } = require("../db/anomalias");

const router = express.Router();

const CAMPOS_UMBRALES = [
  "temperatura_max",
  "humedad_aire_min",
  "humedad_suelo_min",
  "luminosidad_min",
];

function zonaDeQuery(req) {
  return req.query.zona_id || req.body?.zona_id || ZONA_DEFAULT;
}

function validarZonaReq(req, res) {
  const zona_id = zonaDeQuery(req);
  const error = validarZonaId(zona_id);
  if (error) {
    res.status(400).json({ error });
    return null;
  }
  registrarZona(zona_id);
  return zona_id;
}

const { construirEstadoZonas, emitirEstadoZonas } = require("../helpers/zonasEstado");

router.get("/zonas", async (_req, res) => {
  try {
    let zonas = await construirEstadoZonas();
    if (zonas.length === 0) {
      registrarZona(ZONA_DEFAULT);
      zonas = [
        {
          id: ZONA_DEFAULT,
          nombre: "Zona Principal",
          activa: true,
          estado: getZona(ZONA_DEFAULT),
        },
      ];
    }
    res.json(zonas);
  } catch (err) {
    console.error("[API] Error GET /zonas:", err.message);
    res.status(500).json({ error: "Error al obtener zonas" });
  }
});

router.post("/zonas", requireWrite, async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Base de datos no disponible" });
  }

  const { id, nombre, descripcion } = req.body;
  const error = validarZonaId(id);
  if (error) {
    return res.status(400).json({ error });
  }
  if (!nombre || typeof nombre !== "string") {
    return res.status(400).json({ error: "nombre es requerido" });
  }

  try {
    const zona = await crearZona({ id, nombre, descripcion });
    registrarZona(id);
    const zonas = await construirEstadoZonas();
    emitirEstadoZonas();
    res.status(201).json(zona);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "La zona ya existe" });
    }
    res.status(500).json({ error: "Error al crear zona" });
  }
});

router.put("/zonas/:zona_id", requireWrite, async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Base de datos no disponible" });
  }

  const { zona_id } = req.params;
  const error = validarZonaId(zona_id);
  if (error) {
    return res.status(400).json({ error });
  }

  const zona = await actualizarZona(zona_id, {
    nombre: req.body.nombre,
    descripcion: req.body.descripcion,
  });

  if (!zona) {
    return res.status(404).json({ error: "Zona no encontrada" });
  }

  emitirEstadoZonas();
  res.json(zona);
});

router.delete("/zonas/:zona_id", requireWrite, async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Base de datos no disponible" });
  }

  const { zona_id } = req.params;
  if (zona_id === ZONA_DEFAULT) {
    return res.status(400).json({ error: "No se puede desactivar la zona principal" });
  }

  const ok = await desactivarZona(zona_id);
  if (!ok) {
    return res.status(404).json({ error: "Zona no encontrada" });
  }

  emitirEstadoZonas();
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  res.json({ usuario: req.user.usuario, rol: req.user.rol });
});

router.get("/sensores", (req, res) => {
  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }
  const estado = getZona(zona_id);
  res.json({ zona_id, ...estado.sensores });
});

router.get("/actuadores", (req, res) => {
  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }
  res.json({ zona_id, ...getActuadores(zona_id) });
});

router.get("/automatico", (req, res) => {
  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }
  res.json({ zona_id, config: getConfig(zona_id) });
});

router.patch("/automatico/:actuador/modo", requireWrite, (req, res) => {
  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const { actuador } = req.params;
  const { modo } = req.body;

  if (!ACTUADORES_VALIDOS.includes(actuador)) {
    return res.status(400).json({ error: "Actuador inválido" });
  }
  if (!modo || !MODOS_VALIDOS.includes(modo)) {
    return res.status(400).json({ error: "modo debe ser 'manual' o 'automatico'" });
  }

  setModo(zona_id, actuador, modo);
  const config = getConfig(zona_id);
  emitAutomatico(zona_id, config);
  res.json({ zona_id, config });
});

router.put("/automatico/:actuador", requireWrite, (req, res) => {
  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const { actuador } = req.params;

  if (!ACTUADORES_VALIDOS.includes(actuador)) {
    return res.status(400).json({ error: "Actuador inválido" });
  }

  const error = validarConfigActuador(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  setConfigActuador(zona_id, actuador, {
    modo: req.body.modo,
    activar_si: {
      sensor: req.body.activar_si.sensor,
      operador: req.body.activar_si.operador,
      valor: Number(req.body.activar_si.valor),
    },
    desactivar_si: {
      sensor: req.body.desactivar_si.sensor,
      operador: req.body.desactivar_si.operador,
      valor: Number(req.body.desactivar_si.valor),
    },
  });

  const config = getConfig(zona_id);
  emitAutomatico(zona_id, config);
  res.json({ zona_id, config });
});

router.get("/historial", async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Historial no disponible (PostgreSQL desconectado)" });
  }

  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const { sensor, rango } = req.query;

  try {
    if (sensor && rango) {
      if (!SENSORES_VALIDOS.includes(sensor)) {
        return res.status(400).json({ error: "sensor inválido" });
      }
      if (!RANGOS_HISTORIAL.includes(rango)) {
        return res.status(400).json({ error: "rango inválido (24h, 7d, 30d)" });
      }

      const datos = await obtenerHistorialAgregado({ zona_id, sensor, rango });
      return res.json({ zona_id, sensor, rango, datos });
    }

    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
    const offset = (pagina - 1) * limite;
    const { filas, total } = await obtenerHistorial({ zona_id, limite, offset });

    res.json({
      datos: filas,
      zona_id,
      pagina,
      limite,
      total,
      total_paginas: Math.ceil(total / limite) || 1,
    });
  } catch (err) {
    console.error("[API] Error GET /historial:", err.message);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

router.get("/log", async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Log no disponible (PostgreSQL desconectado)" });
  }

  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  try {
    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
    const offset = (pagina - 1) * limite;
    const { filas, total } = await obtenerLog({ zona_id, limite, offset });

    res.json({
      datos: filas,
      zona_id,
      pagina,
      limite,
      total,
      total_paginas: Math.ceil(total / limite) || 1,
    });
  } catch (err) {
    console.error("[API] Error GET /log:", err.message);
    res.status(500).json({ error: "Error al obtener log" });
  }
});

router.get("/riegos", async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Base de datos no disponible" });
  }

  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const riegos = await obtenerRiegosPorZona(zona_id);
  res.json({ zona_id, riegos });
});

router.post("/riegos", requireWrite, async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Base de datos no disponible" });
  }

  const { zona_id, actuador, hora, duracion_minutos, dias_semana } = req.body;
  const errorZona = validarZonaId(zona_id);
  if (errorZona) {
    return res.status(400).json({ error: errorZona });
  }
  if (!ACTUADORES_VALIDOS.includes(actuador)) {
    return res.status(400).json({ error: "Actuador inválido" });
  }
  if (!hora || !/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) {
    return res.status(400).json({ error: "hora inválida (HH:MM)" });
  }
  const duracion = Number(duracion_minutos);
  if (!Number.isFinite(duracion) || duracion < 1 || duracion > 120) {
    return res.status(400).json({ error: "duracion_minutos debe ser entre 1 y 120" });
  }
  if (!Array.isArray(dias_semana) || dias_semana.length === 0) {
    return res.status(400).json({ error: "dias_semana es requerido" });
  }
  if (!dias_semana.every((d) => Number.isInteger(d) && d >= 1 && d <= 7)) {
    return res.status(400).json({ error: "dias_semana debe contener valores 1-7" });
  }

  const riego = await crearRiego({
    zona_id,
    actuador,
    hora: hora.length === 5 ? `${hora}:00` : hora,
    duracion_minutos: duracion,
    dias_semana,
  });

  if (!riego) {
    return res.status(500).json({ error: "Error al crear riego" });
  }

  res.status(201).json(riego);
});

router.put("/riegos/:id", requireWrite, async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Base de datos no disponible" });
  }

  const id = parseInt(req.params.id, 10);
  const datos = { ...req.body };

  if (datos.hora && datos.hora.length === 5) {
    datos.hora = `${datos.hora}:00`;
  }

  const riego = await actualizarRiego(id, datos);
  if (!riego) {
    return res.status(404).json({ error: "Riego no encontrado" });
  }

  res.json(riego);
});

router.delete("/riegos/:id", requireWrite, async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Base de datos no disponible" });
  }

  const id = parseInt(req.params.id, 10);
  const riego = await eliminarRiego(id);
  if (!riego) {
    return res.status(404).json({ error: "Riego no encontrado" });
  }

  res.json({ ok: true });
});

router.get("/umbrales", (req, res) => {
  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }
  res.json({ zona_id, ...getUmbrales(zona_id) });
});

router.put("/umbrales", requireWrite, (req, res) => {
  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const body = req.body;

  for (const campo of CAMPOS_UMBRALES) {
    const valor = body[campo];
    if (valor === undefined || valor === null) {
      return res.status(400).json({ error: `Campo requerido: ${campo}` });
    }
    const num = Number(valor);
    if (!Number.isFinite(num) || num < 0) {
      return res.status(400).json({ error: `${campo} debe ser un número positivo` });
    }
  }

  const umbrales = setUmbrales(zona_id, {
    temperatura_max: Number(body.temperatura_max),
    humedad_aire_min: Number(body.humedad_aire_min),
    humedad_suelo_min: Number(body.humedad_suelo_min),
    luminosidad_min: Number(body.luminosidad_min),
  });

  emitUmbrales(zona_id, umbrales);
  res.json({ zona_id, ...umbrales });
});

router.post("/actuador", requireWrite, actuadorLimiter, async (req, res) => {
  const { actuador, estado } = req.body;
  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  if (!actuador || !ACTUADORES_VALIDOS.includes(actuador)) {
    return res.status(400).json({ error: "Actuador inválido" });
  }

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  const cfg = getConfigActuador(zona_id, actuador);
  if (cfg?.modo === "automatico") {
    return res.status(400).json({ error: "Actuador en modo automático" });
  }

  try {
    await accionarActuador(zona_id, actuador, estado, "manual");
    res.json({ ok: true, zona_id, actuador, estado });
  } catch (err) {
    console.error("[MQTT] Error al publicar:", err.message);
    res.status(500).json({ error: "Error al publicar en MQTT" });
  }
});

router.get("/alertas", async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Alertas no disponibles" });
  }

  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const limite = Math.min(parseInt(req.query.limite, 10) || 50, 200);
  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
  const soloActivas = req.query.activas === "true";
  const { filas, total } = await obtenerAlertas({
    zona_id,
    limite,
    pagina,
    soloActivas,
  });

  res.json({
    datos: filas,
    zona_id,
    pagina,
    limite,
    total,
    total_paginas: Math.ceil(total / limite) || 1,
  });
});

router.patch("/alertas/:id/resolver", requireWrite, async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Alertas no disponibles" });
  }

  const id = parseInt(req.params.id, 10);
  const alerta = await resolverAlerta(id);
  if (!alerta) {
    return res.status(404).json({ error: "Alerta no encontrada" });
  }
  res.json(alerta);
});

router.get("/estadisticas/semana", async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Estadísticas no disponibles" });
  }

  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const stats = await estadisticasSemanales(zona_id);
  res.json({ zona_id, estadisticas: stats });
});

router.get("/estadisticas", async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Estadísticas no disponibles" });
  }

  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const semanas = await estadisticasPorSemana(zona_id);
  res.json({ zona_id, semanas });
});

router.get("/anomalias", async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Anomalías no disponibles" });
  }

  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const limite = Math.min(parseInt(req.query.limite, 10) || 20, 100);
  const datos = await listarAnomalias({ zona_id, limite });
  res.json({ zona_id, datos, total: datos.length });
});

router.get("/prediccion", async (req, res) => {
  if (!isDbDisponible()) {
    return res.status(503).json({ error: "Predicción no disponible" });
  }

  const zona_id = validarZonaReq(req, res);
  if (!zona_id) {
    return;
  }

  const sensor = req.query.sensor || "temperatura";
  if (!SENSORES_VALIDOS.includes(sensor)) {
    return res.status(400).json({ error: "sensor inválido" });
  }

  const pred = await prediccionHoraria(zona_id, sensor);
  res.json(pred);
});

module.exports = router;
