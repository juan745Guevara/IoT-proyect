import { useState, useEffect, useCallback } from "react";
import { getUmbrales, actualizarUmbrales as apiActualizarUmbrales } from "../api/client.js";
import socket from "../socket.js";
import { useZonaActiva } from "../context/ZonaContext.jsx";

const DEFAULT = {
  temperatura_max: 35,
  humedad_aire_min: 40,
  humedad_suelo_min: 30,
  luminosidad_min: 20,
};

export function useUmbrales() {
  const { zonaId } = useZonaActiva();
  const [umbrales, setUmbrales] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onUmbrales = useCallback(
    (payload) => {
      if (payload.zona_id && payload.zona_id !== zonaId) {
        return;
      }
      const { zona_id: _z, ...data } = payload;
      setUmbrales({ ...DEFAULT, ...data });
      setError(null);
      setLoading(false);
    },
    [zonaId]
  );

  useEffect(() => {
    async function cargarInicial() {
      setLoading(true);
      try {
        const data = await getUmbrales(zonaId);
        onUmbrales(data);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    cargarInicial();
    socket.on("umbrales", onUmbrales);
    return () => socket.off("umbrales", onUmbrales);
  }, [zonaId, onUmbrales]);

  const actualizarUmbrales = useCallback(
    async (datos) => {
      setError(null);
      const actualizados = await apiActualizarUmbrales(datos, zonaId);
      const { zona_id: _z, ...rest } = actualizados;
      setUmbrales(rest);
      return actualizados;
    },
    [zonaId]
  );

  return { umbrales, actualizarUmbrales, loading, error, zonaId };
}
