/**
 * Tarjeta visual de un sensor — solo UI.
 * Recibe datos por props; no conoce la API.
 */

const SENSORES_CON_BARRA = ["humedad_aire", "humedad_suelo", "luminosidad"];

function colorTemperatura(valor) {
  if (valor === null) return "sin-senal";
  if (valor < 18) return "frio";
  if (valor <= 28) return "normal";
  return "caliente";
}

export default function SensorCard({ sensor, valor }) {
  const sinSenal = valor === null;
  const mostrarBarra = SENSORES_CON_BARRA.includes(sensor.id);
  const tempClass = sensor.id === "temperatura" ? colorTemperatura(valor) : "";

  return (
    <article className={`sensor-card ${tempClass}`} data-sensor={sensor.id}>
      <span className="sensor-icono" aria-hidden="true">
        {sensor.icono}
      </span>
      <div className="sensor-valor">
        {sinSenal ? (
          <span className="sin-senal-texto">—</span>
        ) : (
          <>
            <span className="valor-numero">
              {typeof valor === "number" ? valor.toFixed(sensor.id === "temperatura" ? 1 : 0) : valor}
            </span>
            <span className="valor-unidad">{sensor.unidad}</span>
          </>
        )}
      </div>
      {sinSenal && <span className="sensor-estado">sin señal</span>}
      {mostrarBarra && !sinSenal && (
        <div className="sensor-barra" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
          <div className="sensor-barra-fill" style={{ width: `${Math.min(100, Math.max(0, valor))}%` }} />
        </div>
      )}
      <h2 className="sensor-label">{sensor.label}</h2>
    </article>
  );
}
