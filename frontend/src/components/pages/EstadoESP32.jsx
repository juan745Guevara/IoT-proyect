import { useState } from "react";
import { useZonas } from "../../hooks/useZonas.js";
import { useAuth } from "../../context/AuthContext.jsx";

const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

function tiempoRelativo(iso) {
  if (!iso) return "sin datos";
  const seg = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 5) return "ahora mismo";
  if (seg < 60) return `hace ${seg}s`;
  if (seg < 3600) return `hace ${Math.floor(seg / 60)}m`;
  return `hace ${Math.floor(seg / 3600)}h`;
}

function ModalZona({ titulo, inicial, onCerrar, onGuardar }) {
  const [id, setId] = useState(inicial?.id ?? "");
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const esNueva = !inicial?.id;

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await onGuardar({ id: id.trim(), nombre: nombre.trim(), descripcion: descripcion.trim() });
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
        <h3>{titulo}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          {esNueva && (
            <label className="auto-field">
              <span>ID (ej. zona2)</span>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                pattern="[a-zA-Z0-9_-]+"
                required
              />
            </label>
          )}
          <label className="auto-field">
            <span>Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label className="auto-field">
            <span>Descripción</span>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </label>
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

function ZonaCard({ zona, onEditar, onEliminar, soloLectura }) {
  const { estado } = zona;
  const conectado = estado?.conectado;
  const s = estado?.sensores;

  return (
    <article className={`zona-card ${conectado ? "zona-card--ok" : "zona-card--err"}`}>
      <div className="zona-card-head">
        <span className={`zona-dot ${conectado ? "zona-dot--ok" : "zona-dot--err"}`} />
        <div>
          <h3>
            {zona.nombre} <span className="zona-id">({zona.id})</span>
          </h3>
          <p className="zona-status">
            {conectado ? "Conectado" : "Desconectado"} · última lectura:{" "}
            {tiempoRelativo(estado?.ultima_lectura)}
          </p>
        </div>
        {!soloLectura && (
          <button
            type="button"
            className="zona-edit-btn"
            onClick={() => onEditar(zona)}
            aria-label="Editar zona"
          >
            <i className="ti ti-settings" aria-hidden="true" />
          </button>
        )}
      </div>
      {conectado && s?.temperatura != null ? (
        <p className="zona-sensores">
          T: {Number(s.temperatura).toFixed(1)}°C · H: {Math.round(s.humedad_aire)}% · S:{" "}
          {Math.round(s.humedad_suelo)}% · L: {Math.round(s.luminosidad)}%
        </p>
      ) : (
        <p className="zona-sensores zona-sensores--muted">Sin datos recientes</p>
      )}
      {zona.id !== "zona1" && !soloLectura && (
        <button type="button" className="zona-desactivar-btn" onClick={() => onEliminar(zona.id)}>
          Desactivar zona
        </button>
      )}
    </article>
  );
}

export default function EstadoESP32() {
  const { isAdmin } = useAuth();
  const { zonas, loading, error, agregarZona, editarZona, eliminarZona } = useZonas();
  const [modal, setModal] = useState(null);

  async function handleCrear(datos) {
    await agregarZona(datos);
  }

  async function handleEditar(datos) {
    await editarZona(modal.id, { nombre: datos.nombre, descripcion: datos.descripcion });
  }

  return (
    <div>
      <div className="page-head-row">
        <h2 className="sec-label">Estado del sistema</h2>
        {isAdmin && (
          <button type="button" className="config-btn" onClick={() => setModal({ tipo: "nueva" })}>
            + Nueva zona
          </button>
        )}
      </div>

      {error && <p className="config-feedback config-feedback--err">{error}</p>}
      {loading ? (
        <p className="config-hint">Cargando zonas…</p>
      ) : (
        <div className="zona-grid">
          {zonas.map((z) => (
            <ZonaCard
              key={z.id}
              zona={z}
              onEditar={(zona) => setModal({ tipo: "editar", ...zona })}
              onEliminar={async (id) => {
                if (window.confirm("¿Desactivar esta zona?")) {
                  await eliminarZona(id);
                }
              }}
              soloLectura={!isAdmin}
            />
          ))}
        </div>
      )}

      {modal?.tipo === "nueva" && (
        <ModalZona
          titulo="Nueva zona"
          onCerrar={() => setModal(null)}
          onGuardar={handleCrear}
        />
      )}
      {modal?.tipo === "editar" && (
        <ModalZona
          titulo="Editar zona"
          inicial={modal}
          onCerrar={() => setModal(null)}
          onGuardar={handleEditar}
        />
      )}
    </div>
  );
}

export { DIAS };
