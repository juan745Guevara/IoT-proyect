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

/** GET /api/estado → { rojo, verde, azul } */
export async function getLeds() {
  const res = await fetch(`${BASE_URL}/api/estado`);
  return parseResponse(res);
}

/** POST /api/led → { ok, led, estado } */
export async function toggleLed(led, estado) {
  const res = await fetch(`${BASE_URL}/api/led`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ led, estado }),
  });
  const data = await parseResponse(res);
  if (!data.ok) {
    throw new Error(data.error || "Error al cambiar el LED");
  }
  return data;
}

export { BASE_URL };
