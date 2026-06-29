const VARIANTS = {
  purple: {
    bg: "rgba(238, 237, 254, 0.97)",
    border: "#534AB7",
    color: "#2A2460",
    iconBg: "rgba(83, 74, 183, 0.22)",
    iconColor: "#453D9E",
    pillOff: "#5A4F9E",
  },
  indigo: {
    bg: "rgba(232, 236, 248, 0.97)",
    border: "#4A5898",
    color: "#1F2A52",
    iconBg: "rgba(74, 88, 152, 0.22)",
    iconColor: "#3D4D85",
    pillOff: "#4A5888",
  },
};

export default function ActuadorBubble({ label, estado, icon = "ti-wind", variant = "purple" }) {
  const isOn = estado === "ON";
  const offline = estado === null || estado === undefined;
  const v = VARIANTS[variant] || VARIANTS.purple;

  return (
    <div
      className={`act-bubble bubble-card act-bubble-${variant} ${isOn ? "act-bubble-on" : ""} ${offline ? "bubble-offline" : ""}`}
      style={{
        background: v.bg,
        borderColor: v.border,
        color: v.color,
      }}
    >
      <div className="bubble-header">
        <span
          className={`bubble-icon-wrap ${isOn ? "act-icon-on" : ""}`}
          style={
            isOn
              ? undefined
              : { background: v.iconBg, color: v.iconColor }
          }
        >
          <i className={`ti ${icon}`} aria-hidden="true" />
        </span>
        <span className="ab-lbl">{label}</span>
        {isOn && <span className="bubble-pulse act-pulse" />}
      </div>
      <span
        className={`ab-pill ${isOn ? "ab-on" : "ab-off"}`}
        style={!isOn && !offline ? { background: v.pillOff, color: "#fff" } : undefined}
      >
        {offline ? "—" : isOn ? "Encendido" : "Apagado"}
      </span>
    </div>
  );
}
