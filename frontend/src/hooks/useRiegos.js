import { useState, useEffect, useCallback } from "react";
import {
  getRiegos,
  crearRiego,
  actualizarRiego,
  eliminarRiego,
} from "../api/client.js";
import { useZonaActiva } from "../context/ZonaContext.jsx";

export function useRiegos() {
  const { zonaId } = useZonaActiva();
  const [riegos, setRiegos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRiegos(zonaId);
      setRiegos(res.riegos ?? []);
    } catch (err) {
      setError(err.message);
      setRiegos([]);
    } finally {
      setLoading(false);
    }
  }, [zonaId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const crear = useCallback(
    async (datos) => {
      const riego = await crearRiego({ ...datos, zona_id: zonaId });
      await recargar();
      return riego;
    },
    [zonaId, recargar]
  );

  const actualizar = useCallback(
    async (id, datos) => {
      const riego = await actualizarRiego(id, datos);
      await recargar();
      return riego;
    },
    [recargar]
  );

  const eliminar = useCallback(
    async (id) => {
      await eliminarRiego(id);
      await recargar();
    },
    [recargar]
  );

  return { riegos, loading, error, crear, actualizar, eliminar, recargar, zonaId };
}
