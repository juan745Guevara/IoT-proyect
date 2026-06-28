/**
 * Tarjeta de detalle de sensor — solo UI.
 */

export default function SensorCard({ id, label, valor, unidad, icono, color, max = 100 }) {
  const sinSenal = valor === null || valor === undefined;
  const display = sinSenal
    ? "—"
    : id === "temperatura"
      ? valor.toFixed(1)
      : String(Math.round(valor));

  const pct = sinSenal ? 0 : Math.min(100, Math.max(0, (valor / max) * 100));

  return (
    <article className="card sensor-detail-card" data-sensor={id}>
      <div className="sensor-detail-row">
        <i className={`ti ${icono} sensor-detail-icon`} aria-hidden="true" />
        <div className="sensor-detail-body">
          <span className="sensor-detail-label">{label}</span>
          <div className="sensor-detail-value">
            <span className="sensor-detail-num">{display}</span>
            {!sinSenal && <span className="sensor-detail-unit">{unidad}</span>}
          </div>
        </div>
      </div>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="bar-fill" style={{ width: `${pct.toFixed(0)}%`, background: color }} />
      </div>
    </article>
  );
}
