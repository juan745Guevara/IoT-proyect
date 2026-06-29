/**
 * Coordenadas en % del contenedor visual (viewBox 0–100).
 * bubble: centro del globo (escalonado) | anchor: punto en la ilustración.
 */
export const GREENHOUSE_HOTSPOTS = [
  {
    id: "luminosidad",
    kind: "sensor",
    side: "left",
    label: "Luminosidad",
    key: "luminosidad",
    unidad: "%",
    variant: "gold",
    icon: "ti-sun",
    color: "#F0B429",
    marker: "ma",
    anchor: { x: 36, y: 15 },
    bubble: { x: 11, y: 13 },
  },
  {
    id: "temperatura",
    kind: "sensor",
    side: "left",
    label: "Temperatura",
    key: "temperatura",
    unidad: "°C",
    variant: "coral",
    icon: "ti-temperature",
    color: "#E85D4C",
    marker: "mg",
    anchor: { x: 42, y: 50 },
    bubble: { x: 7, y: 45 },
  },
  {
    id: "humedad_suelo",
    kind: "sensor",
    side: "left",
    label: "Hum. suelo",
    key: "humedad_suelo",
    unidad: "%",
    variant: "earth",
    icon: "ti-plant",
    color: "#A67C52",
    marker: "ma",
    anchor: { x: 48, y: 77 },
    bubble: { x: 13, y: 76 },
  },
  {
    id: "bomba",
    kind: "actuador",
    side: "right",
    actVariant: "purple",
    label: "Bomba",
    key: "bomba",
    icon: "ti-ripple",
    color: "#534AB7",
    marker: "mp",
    anchor: { x: 47, y: 13 },
    bubble: { x: 89, y: 16 },
  },
  {
    id: "humedad_aire",
    kind: "sensor",
    side: "right",
    label: "Humedad aire",
    key: "humedad_aire",
    unidad: "%",
    variant: "blue",
    icon: "ti-cloud",
    color: "#85B7EB",
    marker: "mb",
    anchor: { x: 56, y: 34 },
    bubble: { x: 93, y: 44 },
  },
  {
    id: "ventilador",
    kind: "actuador",
    side: "right",
    actVariant: "indigo",
    label: "Ventilador",
    key: "ventilador",
    icon: "ti-wind",
    color: "#AFA9EC",
    marker: "mp",
    anchor: { x: 60, y: 60 },
    bubble: { x: 87, y: 76 },
  },
];

/** Origen de la línea: borde interior del globo hacia la imagen */
function lineStart(spot) {
  const { bubble, side } = spot;
  const inset = side === "left" ? 11.5 : -11.5;
  return { x: bubble.x + inset, y: bubble.y };
}

/** Geometría del conector en ángulo (escalera) */
export function getConnectorGeometry(spot) {
  const start = lineStart(spot);
  const { anchor, side } = spot;
  const jointX =
    side === "left"
      ? start.x + (anchor.x - start.x) * 0.82
      : start.x - (start.x - anchor.x) * 0.82;

  const elbow = { x: jointX, y: start.y };
  const path = [
    `M ${start.x} ${start.y}`,
    `L ${jointX} ${start.y}`,
    `L ${jointX} ${anchor.y}`,
    `L ${anchor.x} ${anchor.y}`,
  ].join(" ");

  return { path, start, elbow, anchor };
}

export function connectorPath(spot) {
  return getConnectorGeometry(spot).path;
}
