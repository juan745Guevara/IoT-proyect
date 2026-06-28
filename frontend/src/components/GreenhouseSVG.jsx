/**
 * Ilustración isométrica del invernadero con burbujas de sensores y badges de actuadores.
 * SVG puro — sin imágenes externas.
 */

function fmtTemp(valor) {
  return valor === null || valor === undefined ? "—" : valor.toFixed(1);
}

function fmtPct(valor) {
  return valor === null || valor === undefined ? "—" : String(Math.round(valor));
}

function DataBubble({ x, y, w, h, label, value, unit, bg, color, border, anchorX, anchorY }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <line
        x1={anchorX}
        y1={anchorY}
        x2={cx}
        y2={cy}
        stroke={border}
        strokeWidth="1.5"
        strokeDasharray="4,3"
        markerEnd="url(#arrow)"
      />
      <rect x={x} y={y} width={w} height={h} rx="10" fill={bg} stroke={border} strokeWidth="1.5" />
      <text x={x + 12} y={y + 18} fill={color} fontSize="11" fontWeight="500">
        {label}
      </text>
      <text x={x + 12} y={y + 40} fill={color} fontSize="22" fontWeight="500">
        {value}
        <tspan fontSize="12" dx="4">
          {unit}
        </tspan>
      </text>
    </g>
  );
}

function ActuatorBadge({ x, y, w, h, label, estado, anchorX, anchorY }) {
  const on = estado === "ON";
  const bg = on ? "#534AB7" : "#B4B2A9";
  const color = on ? "#EEEDFE" : "#F1EFE8";
  const pillW = 36;
  const pillH = 18;
  const cx = x + w / 2;
  const cy = y + h / 2;

  return (
    <g>
      <line
        x1={anchorX}
        y1={anchorY}
        x2={x + 4}
        y2={cy}
        stroke={on ? "#534AB7" : "#B4B2A9"}
        strokeWidth="1.5"
        strokeDasharray="4,3"
        markerEnd="url(#arrow-purple)"
      />
      <rect x={x} y={y} width={w} height={h} rx="10" fill={bg} stroke={on ? "#3C3489" : "#888780"} strokeWidth="1" />
      <text x={x + 10} y={y + 16} fill={color} fontSize="10" fontWeight="500">
        {label}
      </text>
      <rect x={x + 10} y={y + 24} width={pillW} height={pillH} rx="9" fill={on ? "#3C3489" : "#888780"} />
      <text x={x + 10 + pillW / 2} y={y + 37} fill={color} fontSize="10" fontWeight="600" textAnchor="middle">
        {estado ?? "OFF"}
      </text>
    </g>
  );
}

export default function GreenhouseSVG({ sensores = {}, actuadores = {} }) {
  const ghAnchor = { x: 340, y: 210 };

  return (
    <svg
      className="greenhouse-svg"
      viewBox="0 0 680 420"
      width="100%"
      role="img"
      aria-label="Invernadero isométrico con datos de sensores"
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#97C459" />
        </marker>
        <marker id="arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#534AB7" />
        </marker>
        <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E6F1FB" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#85B7EB" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Suelo */}
      <ellipse cx="340" cy="385" rx="210" ry="28" fill="#97C459" opacity="0.25" />
      <ellipse cx="340" cy="388" rx="180" ry="18" fill="#639922" opacity="0.15" />

      {/* Sombra base */}
      <polygon points="155,295 525,295 545,315 135,315" fill="#3B6D11" opacity="0.12" />

      {/* Pared trasera */}
      <polygon points="175,195 505,195 525,275 155,275" fill="#85B7EB" opacity="0.2" />

      {/* Camas de cultivo — perspectiva */}
      <polygon points="210,268 310,258 320,278 220,288" fill="#854F0B" opacity="0.25" />
      <polygon points="320,258 420,252 430,272 330,278" fill="#854F0B" opacity="0.25" />
      <polygon points="430,252 490,248 498,268 438,272" fill="#854F0B" opacity="0.2" />

      {/* Plantas */}
      <g fill="#639922">
        <ellipse cx="240" cy="252" rx="14" ry="10" />
        <line x1="240" y1="252" x2="240" y2="272" stroke="#3B6D11" strokeWidth="2" />
        <ellipse cx="268" cy="248" rx="12" ry="9" />
        <line x1="268" y1="248" x2="268" y2="268" stroke="#3B6D11" strokeWidth="2" />
        <ellipse cx="355" cy="245" rx="16" ry="11" />
        <line x1="355" y1="245" x2="355" y2="268" stroke="#3B6D11" strokeWidth="2" />
        <ellipse cx="390" cy="250" rx="13" ry="9" />
        <line x1="390" y1="250" x2="390" y2="270" stroke="#3B6D11" strokeWidth="2" />
        <ellipse cx="445" cy="246" rx="11" ry="8" />
        <line x1="445" y1="246" x2="445" y2="265" stroke="#3B6D11" strokeWidth="2" />
      </g>

      {/* Hojas */}
      <g fill="#97C459" opacity="0.85">
        <ellipse cx="232" cy="246" rx="6" ry="4" transform="rotate(-30 232 246)" />
        <ellipse cx="248" cy="244" rx="5" ry="3" transform="rotate(20 248 244)" />
        <ellipse cx="348" cy="238" rx="7" ry="4" transform="rotate(-15 348 238)" />
        <ellipse cx="400" cy="243" rx="5" ry="3" transform="rotate(25 400 243)" />
      </g>

      {/* Arcos internos de profundidad */}
      <path d="M 195 275 Q 340 140 485 275" fill="none" stroke="#378ADD" strokeWidth="1" opacity="0.2" />
      <path d="M 215 275 Q 340 165 465 275" fill="none" stroke="#378ADD" strokeWidth="1" opacity="0.15" />
      <path d="M 235 275 Q 340 185 445 275" fill="none" stroke="#378ADD" strokeWidth="1" opacity="0.1" />

      {/* Paredes laterales semi-transparentes */}
      <polygon points="155,275 175,195 175,275" fill="#E6F1FB" opacity="0.45" stroke="#85B7EB" strokeWidth="1" />
      <polygon points="525,275 505,195 505,275" fill="#E6F1FB" opacity="0.45" stroke="#85B7EB" strokeWidth="1" />

      {/* Techo arqueado tipo túnel */}
      <path
        d="M 155 275 Q 340 95 525 275 L 505 275 Q 340 120 175 275 Z"
        fill="url(#roofGrad)"
        stroke="#85B7EB"
        strokeWidth="1.5"
        opacity="0.55"
      />
      <path
        d="M 175 275 Q 340 115 505 275"
        fill="none"
        stroke="#378ADD"
        strokeWidth="2"
        opacity="0.4"
      />

      {/* Base frontal */}
      <polygon points="155,275 525,275 545,295 135,295" fill="#EAF3DE" stroke="#97C459" strokeWidth="1.5" opacity="0.9" />

      {/* Marco puerta */}
      <polygon points="310,275 370,275 378,295 302,295" fill="#E6F1FB" opacity="0.5" stroke="#378ADD" strokeWidth="1" />

      {/* Label ESP32 */}
      <rect x="295" y="298" width="90" height="22" rx="6" fill="#3B6D11" opacity="0.9" />
      <text x="340" y="313" fill="#EAF3DE" fontSize="11" fontWeight="600" textAnchor="middle">
        ESP32
      </text>

      {/* Burbujas de sensores */}
      <DataBubble
        x={8}
        y={20}
        w={118}
        h={52}
        label="Temperatura"
        value={fmtTemp(sensores.temperatura)}
        unit="°C"
        bg="#EAF3DE"
        color="#3B6D11"
        border="#97C459"
        anchorX={ghAnchor.x - 80}
        anchorY={ghAnchor.y - 40}
      />
      <DataBubble
        x={8}
        y={110}
        w={118}
        h={52}
        label="Humedad aire"
        value={fmtPct(sensores.humedad_aire)}
        unit="%"
        bg="#E6F1FB"
        color="#185FA5"
        border="#85B7EB"
        anchorX={ghAnchor.x - 100}
        anchorY={ghAnchor.y}
      />
      <DataBubble
        x={8}
        y={200}
        w={118}
        h={52}
        label="Humedad suelo"
        value={fmtPct(sensores.humedad_suelo)}
        unit="%"
        bg="#FAEEDA"
        color="#854F0B"
        border="#EF9F27"
        anchorX={ghAnchor.x - 90}
        anchorY={ghAnchor.y + 30}
      />
      <DataBubble
        x={554}
        y={20}
        w={118}
        h={52}
        label="Luminosidad"
        value={fmtPct(sensores.luminosidad)}
        unit="%"
        bg="#FAEEDA"
        color="#854F0B"
        border="#EF9F27"
        anchorX={ghAnchor.x + 80}
        anchorY={ghAnchor.y - 30}
      />

      {/* Badges actuadores */}
      <ActuatorBadge
        x={554}
        y={110}
        w={118}
        h={48}
        label="Ventilador"
        estado={actuadores.ventilador}
        anchorX={ghAnchor.x + 100}
        anchorY={ghAnchor.y + 10}
      />
      <ActuatorBadge
        x={554}
        y={200}
        w={118}
        h={48}
        label="Bomba"
        estado={actuadores.bomba}
        anchorX={ghAnchor.x + 95}
        anchorY={ghAnchor.y + 40}
      />
    </svg>
  );
}
