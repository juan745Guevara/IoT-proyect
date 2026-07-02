const UMBRALES_DEFAULT = {
  temperatura_max: 35,
  humedad_aire_min: 40,
  humedad_suelo_min: 30,
  luminosidad_min: 20,
};

export default function AlertBar({ sensores, umbrales = UMBRALES_DEFAULT }) {
  if (!sensores) return null;

  const alertas = [];

  if (
    sensores.temperatura != null &&
    sensores.temperatura > umbrales.temperatura_max
  ) {
    alertas.push(
      `Temperatura alta (${Number(sensores.temperatura).toFixed(1)}°C — máx ${umbrales.temperatura_max}°C)`
    );
  }
  if (
    sensores.humedad_suelo != null &&
    sensores.humedad_suelo < umbrales.humedad_suelo_min
  ) {
    alertas.push(
      `Humedad del suelo baja (${Math.round(sensores.humedad_suelo)}% — mín ${umbrales.humedad_suelo_min}%)`
    );
  }
  if (
    sensores.humedad_aire != null &&
    sensores.humedad_aire < umbrales.humedad_aire_min
  ) {
    alertas.push(
      `Humedad del aire baja (${Math.round(sensores.humedad_aire)}% — mín ${umbrales.humedad_aire_min}%)`
    );
  }
  if (
    sensores.luminosidad != null &&
    sensores.luminosidad < umbrales.luminosidad_min
  ) {
    alertas.push(
      `Luminosidad baja (${Math.round(sensores.luminosidad)}% — mín ${umbrales.luminosidad_min}%)`
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
