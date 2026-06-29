import { useState } from "react";
import Toggle from "./Toggle.jsx";

export default function ActuadorCard({ actuador, estado, onToggle }) {
  const [loading, setLoading] = useState(false);
  const isOn = estado === "ON";

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    try {
      await onToggle(actuador.id, isOn ? "OFF" : "ON");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="act-card">
      <div className="act-card-left">
        <i className={`ti ${actuador.icono}`} aria-hidden="true" />
        <div>
          <div className="act-name">{actuador.label}</div>
          <span className={`act-badge ${isOn ? "act-badge-on" : "act-badge-off"}`}>
            {isOn ? "Encendido" : "Apagado"}
          </span>
        </div>
      </div>
      <Toggle
        on={isOn}
        onChange={handleToggle}
        disabled={loading}
        ariaLabel={`${isOn ? "Apagar" : "Encender"} ${actuador.label}`}
      />
    </div>
  );
}
