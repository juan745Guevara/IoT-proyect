import { useState, useEffect, useCallback } from "react";
import { getZonas, crearZona, editarZona, eliminarZona } from "../api/client.js";
import socket from "../socket.js";

export function useZonas() {
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onEstadoZonas = useCallback((data) => {
    if (Array.isArray(data)) {
      setZonas(data);
      setLoading(false);
    }
  }, []);

  const recargar = useCallback(async () => {
    setError(null);
    try {
      const data = await getZonas();
      setZonas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recargar();
    socket.on("estado_zonas", onEstadoZonas);
    return () => socket.off("estado_zonas", onEstadoZonas);
  }, [recargar, onEstadoZonas]);

  const agregarZona = useCallback(async (datos) => {
    const zona = await crearZona(datos);
    await recargar();
    return zona;
  }, [recargar]);

  const editarZonaFn = useCallback(async (id, datos) => {
    const zona = await editarZona(id, datos);
    await recargar();
    return zona;
  }, [recargar]);

  const eliminarZonaFn = useCallback(async (id) => {
    await eliminarZona(id);
    await recargar();
  }, [recargar]);

  return {
    zonas,
    loading,
    error,
    recargar,
    agregarZona,
    editarZona: editarZonaFn,
    eliminarZona: eliminarZonaFn,
  };
}
