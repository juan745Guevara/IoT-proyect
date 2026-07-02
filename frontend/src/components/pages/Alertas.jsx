import { useState } from "react";
import { useAlertas } from "../../hooks/useAlertas.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ZonaSelector from "../common/ZonaSelector.jsx";

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIPO_LABEL = {
  umbral: "Umbral",
  anomalia: "Anomalía",
  sistema: "Sistema",
};

export default function Alertas() {
  const { isAdmin } = useAuth();
  const [soloActivas, setSoloActivas] = useState(false);
  const { alertas, loading, error, pagina, setPagina, totalPaginas, resolver } = useAlertas({
    soloActivas,
  });

  return (
    <div>
      <div className="page-head-row">
        <h2 className="sec-label">Alertas</h2>
        <ZonaSelector />
      </div>

      <div className="alertas-toolbar">
        <label className="alertas-filter">
          <input
            type="checkbox"
            checked={soloActivas}
            onChange={(e) => {
              setSoloActivas(e.target.checked);
              setPagina(1);
            }}
          />
          Solo activas
        </label>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p>Cargando alertas…</p>}

      {!loading && alertas.length === 0 && (
        <div className="page-placeholder">
          <i className="ti ti-bell-off" aria-hidden="true" />
          <h3>Sin alertas</h3>
          <p>No hay alertas para esta zona con el filtro actual.</p>
        </div>
      )}

      <div className="alertas-list">
        {alertas.map((a) => (
          <div
            key={a.id}
            className={`alerta-card ${a.resuelta ? "alerta-card--resuelta" : "alerta-card--activa"}`}
          >
            <div className="alerta-card-head">
              <span className={`alerta-tipo alerta-tipo--${a.tipo}`}>
                {TIPO_LABEL[a.tipo] || a.tipo}
              </span>
              <span className="alerta-fecha">{formatFecha(a.timestamp)}</span>
            </div>
            <p className="alerta-mensaje">{a.mensaje}</p>
            <div className="alerta-meta">
              {a.sensor && <span>Sensor: {a.sensor}</span>}
              {a.valor != null && <span>Valor: {a.valor}</span>}
              {a.umbral != null && <span>Umbral: {a.umbral}</span>}
            </div>
            {!a.resuelta && isAdmin && (
              <button type="button" className="btn-secondary btn-sm" onClick={() => resolver(a.id)}>
                Marcar resuelta
              </button>
            )}
            {a.resuelta && <span className="alerta-resuelta-badge">Resuelta</span>}
          </div>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="paginacion">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </button>
          <span>
            {pagina} / {totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
