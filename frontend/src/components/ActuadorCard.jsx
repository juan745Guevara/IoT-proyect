/**
 * Tarjeta de control de actuador con toggle switch.
 */

import { ESTADO } from "../constants/invernadero.js";

export default function ActuadorCard({ actuador, estado, onToggle, loading }) {
  const encendido = estado === ESTADO.ON;

  function handleToggle() {
    if (loading) return;
    const nuevoEstado = encendido ? ESTADO.OFF : ESTADO.ON;
    onToggle(actuador.id, nuevoEstado);
  }

  return (
    <article className="card actuador-control-card" data-actuador={actuador.id}>
      <i className={`ti ${actuador.icono} actuador-control-icon`} aria-hidden="true" />
      <div className="actuador-control-info">
        <span className="actuador-control-name">{actuador.label}</span>
        <span className={`actuador-badge ${encendido ? "on" : "off"}`}>{encendido ? "ON" : "OFF"}</span>
      </div>
      <button
        type="button"
        className={`toggle ${encendido ? "on" : "off"}`}
        onClick={handleToggle}
        disabled={loading}
        aria-label={`${encendido ? "Apagar" : "Encender"} ${actuador.label}`}
        aria-pressed={encendido}
      />
    </article>
  );
}
