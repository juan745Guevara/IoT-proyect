import { useState } from "react";
import { useRiegos } from "../../hooks/useRiegos.js";
import { DIAS } from "./EstadoESP32.jsx";

const ACTUADORES = [
  { id: "bomba", label: "Riego", icon: "ti-ripple" },
  { id: "ventilador", label: "Ventilación", icon: "ti-wind" },
];

function proximaEjecucion(riego) {
  const ahora = new Date();
  const [h, m] = String(riego.hora).slice(0, 5).split(":").map(Number);
  const candidato = new Date(ahora);
  candidato.setHours(h, m, 0, 0);
  if (candidato <= ahora) {
    candidato.setDate(candidato.getDate() + 1);
  }
  for (let i = 0; i < 8; i++) {
    const dia = candidato.getDay() === 0 ? 7 : candidato.getDay();
    if (riego.dias_semana.includes(dia)) {
      return candidato.toLocaleString("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    candidato.setDate(candidato.getDate() + 1);
  }
  return "—";
}

function ModalRiego({ inicial, onCerrar, onGuardar }) {
  const [actuador, setActuador] = useState(inicial?.actuador ?? "bomba");
  const [hora, setHora] = useState(
    inicial?.hora ? String(inicial.hora).slice(0, 5) : "07:00"
  );
  const [duracion, setDuracion] = useState(inicial?.duracion_minutos ?? 10);
  const [dias, setDias] = useState(inicial?.dias_semana ?? [1, 2, 3, 4, 5]);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function toggleDia(d) {
    setDias((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (dias.length === 0) {
      setError("Selecciona al menos un día");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onGuardar({ actuador, hora, duracion_minutos: Number(duracion), dias_semana: dias });
      onCerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar} role="presentation">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog">
        <h3>{inicial?.id ? "Editar programa" : "Nuevo programa"}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="auto-field">
            <span>Actuador</span>
            <select value={actuador} onChange={(e) => setActuador(e.target.value)}>
              {ACTUADORES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="auto-field">
            <span>Hora</span>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
          </label>
          <label className="auto-field">
            <span>Duración (min)</span>
            <input
              type="number"
              min="1"
              max="120"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              required
            />
          </label>
          <div className="riegos-dias">
            <span className="auto-field span-block">Días</span>
            <div className="riegos-dias-row">
              {DIAS.map((label, i) => {
                const d = i + 1;
                return (
                  <button
                    key={d}
                    type="button"
                    className={`riegos-dia-btn ${dias.includes(d) ? "active" : ""}`}
                    onClick={() => toggleDia(d)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          {error && <p className="config-feedback config-feedback--err">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="pager-btn" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="config-btn" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RiegosSection({ soloLectura = false }) {
  const { riegos, loading, error, crear, actualizar, eliminar } = useRiegos();
  const [modal, setModal] = useState(null);

  async function guardar(datos) {
    if (modal?.id) {
      await actualizar(modal.id, datos);
    } else {
      await crear(datos);
    }
  }

  return (
    <section className="riegos-section">
      <div className="riegos-head">
        <h3 className="riegos-title">Programación de riegos</h3>
        {!soloLectura && (
          <button type="button" className="config-btn" onClick={() => setModal({})}>
            + Nuevo programa
          </button>
        )}
      </div>

      {error && <p className="config-feedback config-feedback--err">{error}</p>}
      {loading ? (
        <p className="config-hint">Cargando programas…</p>
      ) : riegos.length === 0 ? (
        <p className="config-hint">No hay programas activos para esta zona.</p>
      ) : (
        <div className="riegos-list">
          {riegos.map((r) => {
            const act = ACTUADORES.find((a) => a.id === r.actuador);
            return (
              <article key={r.id} className="riego-card">
                <div className="riego-card-main">
                  <i className={`ti ${act?.icon ?? "ti-droplet"}`} aria-hidden="true" />
                  <div>
                    <strong>
                      {act?.label ?? r.actuador} — {String(r.hora).slice(0, 5)} · {r.duracion_minutos} min
                    </strong>
                    <p className="riego-dias">
                      {DIAS.map((label, i) => (
                        <span
                          key={label}
                          className={r.dias_semana.includes(i + 1) ? "riego-dia-on" : "riego-dia-off"}
                        >
                          {label}
                        </span>
                      ))}
                    </p>
                    <p className="riego-prox">Próxima: {proximaEjecucion(r)}</p>
                  </div>
                </div>
                {!soloLectura && (
                  <div className="riego-card-actions">
                    <span className="riego-activo">Activo</span>
                    <button type="button" className="pager-btn" onClick={() => setModal(r)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="pager-btn pager-btn--danger"
                      onClick={() => {
                        if (window.confirm("¿Eliminar este programa?")) {
                          eliminar(r.id);
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {modal && <ModalRiego inicial={modal} onCerrar={() => setModal(null)} onGuardar={guardar} />}
    </section>
  );
}
