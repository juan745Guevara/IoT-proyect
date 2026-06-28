/**
 * Barra de estado de conexión — solo presentación.
 * No realiza peticiones HTTP.
 */

function formatearFecha(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return null;
  }
}

export default function StatusBar({ conectado, verificando, ultimaLectura }) {
  const clase = verificando ? "" : conectado ? "connected" : "error";
  const textoConexion = verificando
    ? "Verificando..."
    : conectado
      ? "Backend conectado"
      : "Sin conexión al backend";

  const fechaFormateada = formatearFecha(ultimaLectura);

  return (
    <div className="status-bar-container">
      <div className={`status-bar ${clase}`} role="status">
        <span className="status-dot" aria-hidden="true" />
        <span>{textoConexion}</span>
      </div>
      {fechaFormateada && (
        <p className="ultima-lectura">
          Última lectura ESP32: <time dateTime={ultimaLectura}>{fechaFormateada}</time>
        </p>
      )}
      {!fechaFormateada && !verificando && conectado && (
        <p className="ultima-lectura sin-datos">Esperando datos del ESP32...</p>
      )}
    </div>
  );
}
