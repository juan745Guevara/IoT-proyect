/**
 * Cliente HTTP centralizado con JWT.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ZONA_DEFAULT = "zona1";
const TOKEN_KEY = "invernadero_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(extra = {}) {
  const headers = { ...extra };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && getToken()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("invernadero_user");
      window.dispatchEvent(new Event("auth:logout"));
    }
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: authHeaders(options.headers || {}),
  });
  return parseResponse(res);
}

function qs(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      p.set(k, String(v));
    }
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** POST /api/auth/login */
export async function login(usuario, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password }),
  });
  return parseResponse(res);
}

/** GET /api/me */
export async function getMe() {
  return apiFetch("/api/me");
}

/** GET /api/zonas */
export async function getZonas() {
  return apiFetch("/api/zonas");
}

/** POST /api/zonas */
export async function crearZona(datos) {
  return apiFetch("/api/zonas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

/** PUT /api/zonas/:id */
export async function editarZona(zona_id, datos) {
  return apiFetch(`/api/zonas/${zona_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

/** DELETE /api/zonas/:id */
export async function eliminarZona(zona_id) {
  return apiFetch(`/api/zonas/${zona_id}`, { method: "DELETE" });
}

/** GET /api/sensores */
export async function getSensores(zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/sensores${qs({ zona_id })}`);
}

/** GET /api/actuadores */
export async function getActuadores(zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/actuadores${qs({ zona_id })}`);
}

/** POST /api/actuador */
export async function toggleActuador(actuador, estado, zona_id = ZONA_DEFAULT) {
  const data = await apiFetch("/api/actuador", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actuador, estado, zona_id }),
  });
  if (!data.ok) {
    throw new Error(data.error || "Error al cambiar el actuador");
  }
  return data;
}

/** GET /api/historial */
export async function getHistorial(params = {}) {
  return apiFetch(`/api/historial${qs(params)}`);
}

/** GET /api/log */
export async function getLog({ zona_id = ZONA_DEFAULT, limite = 50, pagina = 1 } = {}) {
  return apiFetch(`/api/log${qs({ zona_id, limite, pagina })}`);
}

/** GET /api/umbrales */
export async function getUmbrales(zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/umbrales${qs({ zona_id })}`);
}

/** PUT /api/umbrales */
export async function actualizarUmbrales(datos, zona_id = ZONA_DEFAULT) {
  return apiFetch("/api/umbrales", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...datos, zona_id }),
  });
}

/** GET /api/automatico */
export async function getAutomatico(zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/automatico${qs({ zona_id })}`);
}

/** PUT /api/automatico/:actuador */
export async function guardarAutomatico(actuador, datos, zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/automatico/${actuador}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...datos, zona_id }),
  });
}

/** PATCH /api/automatico/:actuador/modo */
export async function setModoAutomatico(actuador, modo, zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/automatico/${actuador}/modo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modo, zona_id }),
  });
}

/** GET /api/riegos */
export async function getRiegos(zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/riegos${qs({ zona_id })}`);
}

/** POST /api/riegos */
export async function crearRiego(datos) {
  return apiFetch("/api/riegos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

/** PUT /api/riegos/:id */
export async function actualizarRiego(id, datos) {
  return apiFetch(`/api/riegos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

/** DELETE /api/riegos/:id */
export async function eliminarRiego(id) {
  return apiFetch(`/api/riegos/${id}`, { method: "DELETE" });
}

/** GET /api/alertas */
export async function getAlertas({ zona_id = ZONA_DEFAULT, limite = 50, pagina = 1, activas } = {}) {
  const params = { zona_id, limite, pagina };
  if (activas) params.activas = "true";
  return apiFetch(`/api/alertas${qs(params)}`);
}

/** PATCH /api/alertas/:id/resolver */
export async function resolverAlerta(id) {
  return apiFetch(`/api/alertas/${id}/resolver`, { method: "PATCH" });
}

/** GET /api/auth/me */
export async function getMe() {
  return apiFetch("/api/auth/me");
}

/** POST /api/auth/logout */
export async function logoutApi() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignorar si el token ya expiró */
  }
}

/** GET /api/estadisticas/semana */
export async function getEstadisticasSemana(zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/estadisticas/semana${qs({ zona_id })}`);
}

/** GET /api/estadisticas */
export async function getEstadisticasSemanas(zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/estadisticas${qs({ zona_id })}`);
}

/** GET /api/admin/backups */
export async function getAdminBackups() {
  return apiFetch("/api/admin/backups");
}

/** DELETE /api/admin/usuarios/:id */
export async function desactivarAdminUsuario(id) {
  return apiFetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
}

/** GET /api/prediccion */
export async function getPrediccion(sensor = "temperatura", zona_id = ZONA_DEFAULT) {
  return apiFetch(`/api/prediccion${qs({ sensor, zona_id })}`);
}

/** GET /api/admin/stats */
export async function getAdminStats() {
  return apiFetch("/api/admin/stats");
}

/** GET /api/admin/usuarios */
export async function getAdminUsuarios() {
  return apiFetch("/api/admin/usuarios");
}

/** POST /api/admin/usuarios */
export async function crearAdminUsuario(datos) {
  return apiFetch("/api/admin/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

/** GET /api/admin/logs */
export async function getAdminLogs(limite = 100) {
  return apiFetch(`/api/admin/logs${qs({ limite })}`);
}

/** GET /api/admin/comandos-pendientes */
export async function getComandosPendientes() {
  return apiFetch("/api/admin/comandos-pendientes");
}

/** POST /api/admin/backup */
export async function ejecutarBackupManual() {
  return apiFetch("/api/admin/backup", { method: "POST" });
}

export { BASE_URL, ZONA_DEFAULT, getToken };
