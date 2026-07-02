import { useState, useEffect, useCallback } from "react";
import { getAlertas, resolverAlerta as apiResolver } from "../api/client.js";
import { useZonaActiva } from "../context/ZonaContext.jsx";
import socket from "../socket.js";

export function useAlertas({ soloActivas = false } = {}) {
  const { zonaId } = useZonaActiva();
  const [alertas, setAlertas] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const limite = 30;

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlertas({ zona_id: zonaId, limite, pagina, activas: soloActivas });
      setAlertas(data.datos || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [zonaId, pagina, soloActivas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    function onNuevaAlerta(alerta) {
      if (alerta.zona_id && alerta.zona_id !== zonaId) {
        return;
      }
      setAlertas((prev) => [alerta, ...prev].slice(0, limite));
      setTotal((t) => t + 1);
    }
    socket.on("alerta", onNuevaAlerta);
    return () => socket.off("alerta", onNuevaAlerta);
  }, [zonaId]);

  const resolver = useCallback(
    async (id) => {
      await apiResolver(id);
      setAlertas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, resuelta: true } : a))
      );
    },
    []
  );

  const totalPaginas = Math.ceil(total / limite) || 1;

  return {
    alertas,
    total,
    pagina,
    setPagina,
    totalPaginas,
    loading,
    error,
    recargar: cargar,
    resolver,
  };
}
