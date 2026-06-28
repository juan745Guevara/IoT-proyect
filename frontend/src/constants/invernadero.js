export const SENSORES = [
  { id: "temperatura", label: "Temperatura", unidad: "°C", icono: "🌡️" },
  { id: "humedad_aire", label: "Humedad del Aire", unidad: "%", icono: "💧" },
  { id: "humedad_suelo", label: "Humedad del Suelo", unidad: "%", icono: "🌱" },
  { id: "luminosidad", label: "Luminosidad", unidad: "%", icono: "☀️" },
];

export const ACTUADORES = [
  { id: "ventilador", label: "Ventilador", icono: "🌀" },
  { id: "bomba", label: "Bomba de Agua", icono: "💦" },
];

export const ESTADO = {
  ON: "ON",
  OFF: "OFF",
};

export const ESTADO_INICIAL_ACTUADORES = Object.fromEntries(
  ACTUADORES.map((a) => [a.id, ESTADO.OFF])
);
