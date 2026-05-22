/**
 * Barra de estado de conexión — solo presentación.
 * No realiza peticiones HTTP.
 */

export default function StatusBar({ conectado, verificando }) {
  const clase = verificando ? "" : conectado ? "connected" : "error";
  const texto = verificando
    ? "Verificando..."
    : conectado
      ? "Conectado"
      : "Sin conexión";

  return (
    <div className={`status-bar ${clase}`} role="status">
      <span className="status-dot" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}
