export default function SensorCard({ label, valor, unidad, icono, barColor, max }) {
  const display =
    valor === null || valor === undefined
      ? "—"
      : label === "Temperatura"
        ? Number(valor).toFixed(1)
        : Math.round(valor);

  const pct =
    valor !== null && valor !== undefined ? Math.min(100, (valor / max) * 100).toFixed(0) : 0;

  return (
    <div className="sensor-card">
      <i className={`ti ${icono}`} aria-hidden="true" />
      <div className="sc-lbl">{label}</div>
      <div className="sc-val">
        {display}
        <span className="sc-unit"> {unidad}</span>
      </div>
      <div className="sc-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="sc-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}
