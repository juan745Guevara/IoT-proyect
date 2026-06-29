const UMBRALES = {
  temperatura: { max: 35, label: "Temperatura alta" },
  humedad_suelo: { min: 40, label: "Humedad del suelo baja" },
  humedad_aire: { min: 40, label: "Humedad del aire baja" },
};

export default function AlertBar({ sensores }) {
  if (!sensores) return null;

  const alertas = [];

  if (sensores.temperatura != null && sensores.temperatura > UMBRALES.temperatura.max) {
    alertas.push(
      `Temperatura alta (${Number(sensores.temperatura).toFixed(1)}°C — máx ${UMBRALES.temperatura.max}°C)`
    );
  }
  if (sensores.humedad_suelo != null && sensores.humedad_suelo < UMBRALES.humedad_suelo.min) {
    alertas.push(
      `Humedad del suelo baja (${Math.round(sensores.humedad_suelo)}% — mín ${UMBRALES.humedad_suelo.min}%)`
    );
  }
  if (sensores.humedad_aire != null && sensores.humedad_aire < UMBRALES.humedad_aire.min) {
    alertas.push(
      `Humedad del aire baja (${Math.round(sensores.humedad_aire)}% — mín ${UMBRALES.humedad_aire.min}%)`
    );
  }

  if (alertas.length === 0) return null;

  return (
    <div className="alert-bar" role="alert">
      <i className="ti ti-alert-triangle" aria-hidden="true" />
      <div className="alert-bar-msgs">
        {alertas.map((a, i) => (
          <span key={i}>{a}</span>
        ))}
      </div>
    </div>
  );
}
