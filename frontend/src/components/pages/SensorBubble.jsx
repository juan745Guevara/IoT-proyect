const VARIANTS = {
  green: {
    bg: "rgba(234, 243, 222, 0.95)",
    border: "#97C459",
    color: "#3B6D11",
    iconBg: "rgba(151, 196, 89, 0.25)",
  },
  blue: {
    bg: "rgba(230, 241, 251, 0.95)",
    border: "#85B7EB",
    color: "#185FA5",
    iconBg: "rgba(133, 183, 235, 0.25)",
  },
  amber: {
    bg: "rgba(250, 238, 218, 0.95)",
    border: "#EF9F27",
    color: "#854F0B",
    iconBg: "rgba(239, 159, 39, 0.25)",
  },
  gold: {
    bg: "rgba(255, 248, 220, 0.96)",
    border: "#F0B429",
    color: "#7A5C00",
    iconBg: "rgba(240, 180, 41, 0.3)",
  },
  coral: {
    bg: "rgba(255, 236, 232, 0.96)",
    border: "#E85D4C",
    color: "#9E2B1F",
    iconBg: "rgba(232, 93, 76, 0.22)",
  },
  earth: {
    bg: "rgba(243, 232, 220, 0.96)",
    border: "#A67C52",
    color: "#5C3D1E",
    iconBg: "rgba(166, 124, 82, 0.28)",
  },
};

function formatVal(valor, unidad) {
  if (valor === null || valor === undefined) return "—";
  if (unidad === "°C") return Number(valor).toFixed(1);
  return String(Math.round(valor));
}

export default function SensorBubble({ label, valor, unidad, variant = "green", icon }) {
  const v = VARIANTS[variant] || VARIANTS.green;
  const offline = valor === null || valor === undefined;

  return (
    <div
      className={`sensor-bubble bubble-card ${offline ? "bubble-offline" : "bubble-live"}`}
      style={{
        background: v.bg,
        borderColor: v.border,
        color: v.color,
      }}
    >
      <div className="bubble-header">
        <span className="bubble-icon-wrap" style={{ background: v.iconBg }}>
          <i className={`ti ${icon}`} aria-hidden="true" />
        </span>
        <span className="sb-lbl">{label}</span>
        {!offline && <span className="bubble-pulse" style={{ background: v.border }} />}
      </div>
      <div className="sb-val">
        {formatVal(valor, unidad)}
        <span className="sb-unit">{unidad}</span>
      </div>
    </div>
  );
}
