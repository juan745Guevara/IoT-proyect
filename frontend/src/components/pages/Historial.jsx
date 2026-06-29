export default function Historial() {
  return (
    <div>
      <h2 className="sec-label">Historial de lecturas</h2>
      <div className="page-placeholder">
        <i className="ti ti-chart-line" aria-hidden="true" />
        <h3>Historial próximamente</h3>
        <p>
          Aquí verás gráficas de temperatura, humedad y luminosidad de los últimos 7 días. Requiere
          base de datos PostgreSQL.
        </p>
      </div>
    </div>
  );
}
