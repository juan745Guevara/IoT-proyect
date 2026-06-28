/**
 * Cliente HTTP centralizado.
 * Solo lógica pura — sin JSX ni estilos.
 * En React Native se copia este archivo y se cambia BASE_URL.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data;
}

/** GET /api/sensores → { temperatura, humedad_aire, humedad_suelo, luminosidad, ultima_lectura } */
export async function getSensores() {
  const res = await fetch(`${BASE_URL}/api/sensores`);
  return parseResponse(res);
}

/** GET /api/actuadores → { ventilador, bomba } */
export async function getActuadores() {
  const res = await fetch(`${BASE_URL}/api/actuadores`);
  return parseResponse(res);
}

/** POST /api/actuador → { ok, actuador, estado } */
export async function toggleActuador(actuador, estado) {
  const res = await fetch(`${BASE_URL}/api/actuador`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actuador, estado }),
  });
  const data = await parseResponse(res);
  if (!data.ok) {
    throw new Error(data.error || "Error al cambiar el actuador");
  }
  return data;
}

export { BASE_URL };
