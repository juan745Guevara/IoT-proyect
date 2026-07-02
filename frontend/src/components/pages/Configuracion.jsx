import { useState, useEffect } from "react";
import { useAutomatico } from "../../hooks/useAutomatico.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ZonaSelector from "../common/ZonaSelector.jsx";
import RiegosSection from "./RiegosSection.jsx";

const SENSORES = [
  { value: "temperatura", label: "Temperatura" },
  { value: "humedad_aire", label: "Humedad del aire" },
  { value: "humedad_suelo", label: "Humedad del suelo" },
  { value: "luminosidad", label: "Luminosidad" },
];

const OPERADORES = [
  { value: ">=", label: "Mayor o igual que" },
  { value: "<=", label: "Menor o igual que" },
  { value: "<", label: "Menor que" },
  { value: ">", label: "Mayor que" },
];

const ACTUADORES = [
  { id: "ventilador", label: "Ventilación", icon: "ti-wind" },
  { id: "bomba", label: "Riego", icon: "ti-ripple" },
];

function unidadSensor(sensor) {
  return sensor === "temperatura" ? "°C" : "%";
}

function ActuadorConfig({ actuador, cfg, onSetModo, onGuardar, soloLectura = false }) {
  const [draft, setDraft] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const datos = draft ?? cfg;
  const esAutomatico = datos.modo === "automatico";

  useEffect(() => {
    setDraft(null);
    setFeedback(null);
  }, [cfg]);

  function patchCondicion(tipo, campo, valor) {
    setDraft((prev) => {
      const base = prev ?? cfg;
      return {
        ...base,
        [tipo]: { ...base[tipo], [campo]: valor },
      };
    });
    setFeedback(null);
  }

  async function handleModo(modo) {
    try {
      await onSetModo(actuador.id, modo);
    } catch (err) {
      setFeedback({ tipo: "err", msg: err.message });
    }
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    setFeedback(null);
    try {
      const payload = {
        modo: datos.modo,
        activar_si: {
          ...datos.activar_si,
          valor: Number(datos.activar_si.valor),
        },
        desactivar_si: {
          ...datos.desactivar_si,
          valor: Number(datos.desactivar_si.valor),
        },
      };
      await onGuardar(actuador.id, payload);
      setDraft(null);
      setFeedback({ tipo: "ok", msg: "✓ Guardado" });
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback({ tipo: "err", msg: err.message });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="auto-card">
      <div className="auto-card-head">
        <i className={`ti ${actuador.icon}`} aria-hidden="true" />
        <h3>{actuador.label}</h3>
      </div>

      <div className="auto-modo-row">
        <span className="auto-modo-label">Modo</span>
        <div className="auto-modo-toggle">
          <button
            type="button"
            className={`auto-modo-btn ${datos.modo === "manual" ? "active" : ""}`}
            onClick={() => handleModo("manual")}
            disabled={soloLectura}
          >
            Manual
          </button>
          <button
            type="button"
            className={`auto-modo-btn ${datos.modo === "automatico" ? "active" : ""}`}
            onClick={() => handleModo("automatico")}
            disabled={soloLectura}
          >
            Automático
          </button>
        </div>
      </div>

      {esAutomatico && (
        <form className="auto-form" onSubmit={handleGuardar}>
          <fieldset className="auto-fieldset">
            <legend>Activar si</legend>
            <div className="auto-cond-grid">
              <label className="auto-field auto-field--sensor">
                <span>Sensor</span>
                <select
                  value={datos.activar_si.sensor}
                  onChange={(e) => patchCondicion("activar_si", "sensor", e.target.value)}
                >
                  {SENSORES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="auto-field auto-field--condicion">
                <span>Condición</span>
                <select
                  value={datos.activar_si.operador}
                  onChange={(e) => patchCondicion("activar_si", "operador", e.target.value)}
                >
                  {OPERADORES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="auto-field auto-field--valor">
                <span>Valor</span>
                <div className="config-input-wrap">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="config-input"
                    value={datos.activar_si.valor}
                    onChange={(e) => patchCondicion("activar_si", "valor", e.target.value)}
                    required
                  />
                  <span className="config-unit">{unidadSensor(datos.activar_si.sensor)}</span>
                </div>
              </label>
            </div>
          </fieldset>

          <fieldset className="auto-fieldset">
            <legend>Desactivar si</legend>
            <div className="auto-cond-grid">
              <label className="auto-field auto-field--sensor">
                <span>Sensor</span>
                <select
                  value={datos.desactivar_si.sensor}
                  onChange={(e) => patchCondicion("desactivar_si", "sensor", e.target.value)}
                >
                  {SENSORES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="auto-field auto-field--condicion">
                <span>Condición</span>
                <select
                  value={datos.desactivar_si.operador}
                  onChange={(e) => patchCondicion("desactivar_si", "operador", e.target.value)}
                >
                  {OPERADORES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="auto-field auto-field--valor">
                <span>Valor</span>
                <div className="config-input-wrap">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="config-input"
                    value={datos.desactivar_si.valor}
                    onChange={(e) => patchCondicion("desactivar_si", "valor", e.target.value)}
                    required
                  />
                  <span className="config-unit">{unidadSensor(datos.desactivar_si.sensor)}</span>
                </div>
              </label>
            </div>
          </fieldset>

          <button type="submit" className="config-btn" disabled={guardando || soloLectura}>
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </form>
      )}

      {feedback && (
        <p className={`config-feedback config-feedback--${feedback.tipo}`} role="status">
          {feedback.msg}
        </p>
      )}
    </section>
  );
}

export default function Configuracion() {
  const { isAdmin } = useAuth();
  const { config, setModo, guardarConfig, loading, error } = useAutomatico();
  const soloLectura = !isAdmin;

  if (loading) {
    return (
      <div>
        <h2 className="sec-label">Modo automático</h2>
        <p className="config-hint">Cargando…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head-row">
        <h2 className="sec-label">Modo automático</h2>
        <ZonaSelector />
      </div>
      <p className="config-hint">
        Configura cuándo se encienden y apagan la ventilación y el riego según los sensores.
      </p>

      {soloLectura && (
        <p className="readonly-banner">
          <i className="ti ti-eye" aria-hidden="true" /> Modo solo lectura — no puedes cambiar la configuración
        </p>
      )}

      {error && (
        <p className="config-feedback config-feedback--err" role="alert">
          {error}
        </p>
      )}

      <div className="auto-grid">
        {ACTUADORES.map((a) => (
          <ActuadorConfig
            key={a.id}
            actuador={a}
            cfg={config[a.id]}
            onSetModo={setModo}
            onGuardar={guardarConfig}
            soloLectura={soloLectura}
          />
        ))}
      </div>

      <RiegosSection soloLectura={soloLectura} />
    </div>
  );
}
