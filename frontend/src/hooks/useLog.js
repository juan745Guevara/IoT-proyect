import { useState, useEffect, useCallback } from "react";
import { getLog } from "../api/client.js";
import socket from "../socket.js";
import { useZonaActiva } from "../context/ZonaContext.jsx";

export function useLog({ limite = 50 } = {}) {
  const { zonaId } = useZonaActiva();
  const [datos, setDatos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(
    async (p) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getLog({ zona_id: zonaId, limite, pagina: p });
        setDatos(res.datos ?? []);
        setPagina(res.pagina ?? p);
        setTotalPaginas(res.total_paginas ?? 1);
      } catch (err) {
        setError(err.message);
        setDatos([]);
      } finally {
        setLoading(false);
      }
    },
    [zonaId, limite]
  );

  useEffect(() => {
    cargar(1);
  }, [zonaId, limite, cargar]);

  const onLogAccion = useCallback(
    (entrada) => {
      if (entrada.zona_id !== zonaId) {
        return;
      }
      setDatos((prev) => {
        if (pagina !== 1) {
          return prev;
        }
        return [entrada, ...prev].slice(0, limite);
      });
    },
    [zonaId, pagina, limite]
  );

  useEffect(() => {
    socket.on("log_accion", onLogAccion);
    return () => socket.off("log_accion", onLogAccion);
  }, [onLogAccion]);

  return {
    datos,
    pagina,
    totalPaginas,
    loading,
    error,
    irPagina: cargar,
    zonaId,
  };
}
