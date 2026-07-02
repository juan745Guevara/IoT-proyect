import { useState } from "react";
import Toggle from "./Toggle.jsx";

export default function ActuadorCard({
  actuador,
  estado,
  onToggle,
  modoAutomatico = false,
  readOnly = false,
}) {
  const [loading, setLoading] = useState(false);
  const isOn = estado === "ON";
  const disabled = loading || modoAutomatico || readOnly;

  async function handleToggle() {
    if (disabled) return;
    setLoading(true);
    try {
      await onToggle(actuador.id, isOn ? "OFF" : "ON");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`act-card ${modoAutomatico ? "act-card-auto" : ""}`}>
      <div className="act-card-left">
        <i className={`ti ${actuador.icono}`} aria-hidden="true" />
        <div>
          <div className="act-name-row">
            <span className="act-name">{actuador.label}</span>
            {modoAutomatico && <span className="act-auto-badge">AUTO</span>}
          </div>
          <span className={`act-badge ${isOn ? "act-badge-on" : "act-badge-off"}`}>
            {isOn ? "Encendido" : "Apagado"}
          </span>
          {readOnly && (
            <span className="act-auto-hint">Solo lectura — sin permiso de control</span>
          )}
          {modoAutomatico && (
            <span className="act-auto-hint">En modo automático — configura en Ajustes</span>
          )}
        </div>
      </div>
      <Toggle
        on={isOn}
        onChange={handleToggle}
        disabled={disabled}
        ariaLabel={`${isOn ? "Apagar" : "Encender"} ${actuador.label}`}
      />
    </div>
  );
}
