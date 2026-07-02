import { useState, useEffect, useCallback } from "react";
import { getHistorial } from "../api/client.js";
import { useZonaActiva } from "../context/ZonaContext.jsx";

export function useHistorial({ sensor, rango }) {
  const { zonaId } = useZonaActiva();
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!sensor || !rango) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getHistorial({ zona_id: zonaId, sensor, rango });
      setDatos(res.datos ?? []);
    } catch (err) {
      setError(err.message);
      setDatos([]);
    } finally {
      setLoading(false);
    }
  }, [zonaId, sensor, rango]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { datos, loading, error, recargar: cargar, zonaId };
}
