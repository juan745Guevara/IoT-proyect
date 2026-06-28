/**
 * Tarjeta visual de un actuador — solo UI.
 * Recibe datos y eventos por props; no conoce la API.
 */

import { ESTADO } from "../constants/invernadero.js";

export default function ActuadorCard({ actuador, estado, onToggle, loading }) {
  const encendido = estado === ESTADO.ON;

  return (
    <article className={`actuador-card ${encendido ? "on" : "off"}`} data-actuador={actuador.id}>
      <span className="actuador-icono" aria-hidden="true">
        {actuador.icono}
      </span>
      <h2 className="actuador-label">{actuador.label}</h2>
      <div
        className={`actuador-indicador ${encendido ? "activo" : ""}`}
        aria-label={encendido ? "Encendido" : "Apagado"}
      >
        <span className="actuador-estado-texto">{encendido ? "ON" : "OFF"}</span>
      </div>
      <button
        type="button"
        className={`toggle-btn ${encendido ? "on" : ""}`}
        onClick={() => onToggle(encendido ? ESTADO.OFF : ESTADO.ON)}
        disabled={loading}
      >
        {loading ? (
          <span className="spinner" aria-hidden="true" />
        ) : encendido ? (
          "Apagar"
        ) : (
          "Encender"
        )}
      </button>
    </article>
  );
}
