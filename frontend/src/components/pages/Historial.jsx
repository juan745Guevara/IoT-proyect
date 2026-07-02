import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useHistorial } from "../../hooks/useHistorial.js";
import { useLog } from "../../hooks/useLog.js";
import { useEstadisticas, fetchPrediccionSensor } from "../../hooks/useEstadisticas.js";
import ZonaSelector from "../common/ZonaSelector.jsx";
import { labelActuador } from "../../constants/invernadero.js";
import { useZonaActiva } from "../../context/ZonaContext.jsx";

const SENSORES = [
  { id: "temperatura", label: "Temperatura", color: "#ef9f27", unidad: "°C" },
  { id: "humedad_aire", label: "Humedad aire", color: "#378add", unidad: "%" },
  { id: "humedad_suelo", label: "Suelo", color: "#639922", unidad: "%" },
  { id: "luminosidad", label: "Luminosidad", color: "#f0c040", unidad: "%" },
];

const RANGOS = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
];

const ORIGEN_BADGE = {
  automatico: "log-badge--auto",
  manual: "log-badge--manual",
  programado: "log-badge--prog",
  anomalia: "log-badge--anom",
};

function formatEje(iso, rango) {
  const d = new Date(iso);
  if (rango === "24h") {
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatSemana(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const fin = new Date(d);
  fin.setDate(fin.getDate() + 6);
  return `${d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} – ${fin.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`;
}

function fmtTrio(avg, max, min, unidad) {
  const f = (v) => (v == null ? "—" : `${v}${unidad}`);
  return `${f(avg)} / ${f(max)} / ${f(min)}`;
}

function exportarCsv(datos, sensor, unidad) {
  const filas = [["timestamp", "valor", "unidad"]];
  for (const p of datos) {
    filas.push([p.timestamp, p.valor, unidad]);
  }
  const csv = filas.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `historial_${sensor}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function GraficasPanel() {
  const { zonaId } = useZonaActiva();
  const [sensor, setSensor] = useState("temperatura");
  const [rango, setRango] = useState("24h");
  const [predPorHora, setPredPorHora] = useState(null);
  const { datos, loading, error } = useHistorial({ sensor, rango });

  const sensorCfg = SENSORES.find((s) => s.id === sensor);

  useEffect(() => {
    if (rango !== "24h") {
      setPredPorHora(null);
      return;
    }
    let cancel = false;
    fetchPrediccionSensor(sensor, zonaId)
      .then((pred) => {
        if (!cancel) {
          const mapa = Object.fromEntries(
            (pred?.por_hora || []).map((p) => [p.hora, p.valor_esperado])
          );
          setPredPorHora(mapa);
        }
      })
      .catch(() => {
        if (!cancel) setPredPorHora(null);
      });
    return () => {
      cancel = true;
    };
  }, [sensor, rango, zonaId]);

  const chartData = useMemo(
    () =>
      datos.map((p) => {
        const hora = new Date(p.timestamp).getHours();
        return {
          ...p,
          label: formatEje(p.timestamp, rango),
          valor: Number(p.valor),
          esperado:
            rango === "24h" && predPorHora ? Number(predPorHora[hora]) || null : null,
        };
      }),
    [datos, rango, predPorHora]
  );

  return (
    <>
      <div className="hist-tabs">
        {SENSORES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`hist-tab ${sensor === s.id ? "active" : ""}`}
            onClick={() => setSensor(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="hist-rangos">
        {RANGOS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`hist-rango-btn ${rango === r.id ? "active" : ""}`}
            onClick={() => setRango(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && <p className="config-feedback config-feedback--err">{error}</p>}

      {loading ? (
        <p className="config-hint">Cargando gráfica…</p>
      ) : chartData.length === 0 ? (
        <div className="page-placeholder">
          <i className="ti ti-chart-line" aria-hidden="true" />
          <h3>Sin lecturas en este período</h3>
        </div>
      ) : (
        <div className="hist-chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                unit={` ${sensorCfg.unidad}`}
              />
              <Tooltip
                formatter={(v, name) => [
                  `${Number(v).toFixed(1)} ${sensorCfg.unidad}`,
                  name === "esperado" ? "Valor esperado" : sensorCfg.label,
                ]}
                labelFormatter={(l) => l}
                contentStyle={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              {rango === "24h" && predPorHora && (
                <Legend
                  formatter={(value) =>
                    value === "esperado" ? "Valor esperado (histórico)" : "Lectura actual"
                  }
                />
              )}
              <Line
                type="monotone"
                dataKey="valor"
                name="valor"
                stroke={sensorCfg.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              {rango === "24h" && predPorHora && (
                <Line
                  type="monotone"
                  dataKey="esperado"
                  name="esperado"
                  stroke="var(--text-muted)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <button
        type="button"
        className="config-btn hist-export-btn"
        disabled={!chartData.length}
        onClick={() => exportarCsv(chartData, sensor, sensorCfg.unidad)}
      >
        Exportar CSV
      </button>
    </>
  );
}

function EstadisticasPanel({ semanas, loading }) {
  if (loading) {
    return <p className="config-hint">Cargando estadísticas…</p>;
  }
  if (!semanas.length) {
    return (
      <div className="page-placeholder">
        <i className="ti ti-chart-bar" aria-hidden="true" />
        <h3>Sin datos semanales</h3>
      </div>
    );
  }

  return (
    <div className="historial-table-wrap">
      <table className="historial-table stats-semana-table">
        <thead>
          <tr>
            <th>Semana</th>
            <th>Temp (avg/max/min)</th>
            <th>Humedad aire</th>
            <th>Humedad suelo</th>
            <th>Luminosidad</th>
          </tr>
        </thead>
        <tbody>
          {semanas.map((s) => (
            <tr key={s.semana}>
              <td>{formatSemana(s.semana)}</td>
              <td>{fmtTrio(s.temp_avg, s.temp_max, s.temp_min, "°C")}</td>
              <td>{fmtTrio(s.haire_avg, s.haire_max, s.haire_min, "%")}</td>
              <td>{fmtTrio(s.hsuelo_avg, s.hsuelo_max, s.hsuelo_min, "%")}</td>
              <td>{fmtTrio(s.luz_avg, s.luz_max, s.luz_min, "%")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccionesPanel() {
  const { datos, pagina, totalPaginas, loading, error, irPagina } = useLog({ limite: 30 });

  return (
    <>
      {error && <p className="config-feedback config-feedback--err">{error}</p>}
      {loading ? (
        <p className="config-hint">Cargando acciones…</p>
      ) : datos.length === 0 ? (
        <div className="page-placeholder">
          <i className="ti ti-list" aria-hidden="true" />
          <h3>Sin acciones registradas</h3>
        </div>
      ) : (
        <>
          <div className="historial-table-wrap">
            <table className="historial-table log-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actuador</th>
                  <th>Estado</th>
                  <th>Origen</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((fila) => (
                  <tr key={fila.id}>
                    <td>{formatFecha(fila.timestamp)}</td>
                    <td>{labelActuador(fila.actuador)}</td>
                    <td>{fila.estado}</td>
                    <td>
                      <span className={`log-badge ${ORIGEN_BADGE[fila.origen] || ""}`}>
                        {fila.origen}
                      </span>
                    </td>
                    <td>
                      {fila.valor_sensor != null
                        ? fila.sensor_disparador === "temperatura"
                          ? `${Number(fila.valor_sensor).toFixed(1)}°C`
                          : `${Math.round(fila.valor_sensor)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="historial-pager">
            <button
              type="button"
              className="pager-btn"
              disabled={pagina <= 1}
              onClick={() => irPagina(pagina - 1)}
            >
              Anterior
            </button>
            <span className="pager-info">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              type="button"
              className="pager-btn"
              disabled={pagina >= totalPaginas}
              onClick={() => irPagina(pagina + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default function Historial() {
  const [vista, setVista] = useState("graficas");
  const { prediccion, semanas, loading: statsLoading, UNIDADES } = useEstadisticas();

  return (
    <div>
      <div className="page-head-row">
        <h2 className="sec-label">Historial</h2>
        <ZonaSelector />
      </div>

      {prediccion?.mensaje && (
        <p className="prediccion-box">
          <i className="ti ti-bulb" aria-hidden="true" /> {prediccion.mensaje}
          {prediccion.valor_esperado != null &&
            ` (${prediccion.valor_esperado}${UNIDADES.temperatura})`}
        </p>
      )}

      <div className="hist-vista-tabs">
        <button
          type="button"
          className={`hist-vista-tab ${vista === "graficas" ? "active" : ""}`}
          onClick={() => setVista("graficas")}
        >
          Gráficas
        </button>
        <button
          type="button"
          className={`hist-vista-tab ${vista === "estadisticas" ? "active" : ""}`}
          onClick={() => setVista("estadisticas")}
        >
          Estadísticas
        </button>
        <button
          type="button"
          className={`hist-vista-tab ${vista === "acciones" ? "active" : ""}`}
          onClick={() => setVista("acciones")}
        >
          Acciones
        </button>
      </div>

      {vista === "graficas" && <GraficasPanel />}
      {vista === "estadisticas" && (
        <EstadisticasPanel semanas={semanas} loading={statsLoading} />
      )}
      {vista === "acciones" && <AccionesPanel />}
    </div>
  );
}
