export const NOMBRE_DISPOSITIVO = "Invernadero-01";

export const SENSORES = [
  { id: "temperatura", label: "Temperatura", unidad: "°C", icono: "🌡️" },
  { id: "humedad_aire", label: "Humedad del Aire", unidad: "%", icono: "💧" },
  { id: "humedad_suelo", label: "Humedad del Suelo", unidad: "%", icono: "🌱" },
  { id: "luminosidad", label: "Luminosidad", unidad: "%", icono: "☀️" },
];

export const ACTUADORES = [
  { id: "ventilador", label: "Ventilación", icono: "🌀" },
  { id: "bomba", label: "Riego", icono: "💦" },
];

export const ESTADO = {
  ON: "ON",
  OFF: "OFF",
};

export const ESTADO_INICIAL_ACTUADORES = Object.fromEntries(
  ACTUADORES.map((a) => [a.id, ESTADO.OFF])
);

export const LABEL_ACTUADOR = Object.fromEntries(
  ACTUADORES.map((a) => [a.id, a.label])
);

export function labelActuador(id) {
  return LABEL_ACTUADOR[id] ?? id;
}
