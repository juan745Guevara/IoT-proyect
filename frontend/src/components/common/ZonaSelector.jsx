import { useZonas } from "../../hooks/useZonas.js";
import { useZonaActiva } from "../../context/ZonaContext.jsx";

export default function ZonaSelector({ className = "" }) {
  const { zonas, loading } = useZonas();
  const { zonaId, setZonaId } = useZonaActiva();

  if (loading && zonas.length === 0) {
    return <span className={`zona-selector ${className}`}>Cargando zonas…</span>;
  }

  const lista = zonas.length > 0 ? zonas : [{ id: "zona1", nombre: "Zona Principal" }];

  return (
    <label className={`zona-selector ${className}`}>
      <span className="zona-selector-label">Zona</span>
      <select
        value={zonaId}
        onChange={(e) => setZonaId(e.target.value)}
        className="zona-selector-select"
      >
        {lista.map((z) => (
          <option key={z.id} value={z.id}>
            {z.nombre} ({z.id})
          </option>
        ))}
      </select>
    </label>
  );
}
