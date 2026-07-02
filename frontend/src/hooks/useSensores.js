import { useState, useEffect, useCallback } from "react";
import { getSensores } from "../api/client.js";
import socket from "../socket.js";
import { useZonaActiva } from "../context/ZonaContext.jsx";

function mapSensores(data) {
  return {
    temperatura: data.temperatura ?? null,
    humedad_aire: data.humedad_aire ?? null,
    humedad_suelo: data.humedad_suelo ?? null,
    luminosidad: data.luminosidad ?? null,
  };
}

export function useSensores() {
  const { zonaId } = useZonaActiva();
  const [sensores, setSensores] = useState({
    temperatura: null,
    humedad_aire: null,
    humedad_suelo: null,
    luminosidad: null,
  });
  const [ultimaLectura, setUltimaLectura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onSensores = useCallback(
    (payload) => {
      if (payload.zona_id && payload.zona_id !== zonaId) {
        return;
      }
      const data = payload.datos ?? payload;
      setSensores(mapSensores(data));
      setUltimaLectura(data.ultima_lectura ?? new Date().toISOString());
      setError(null);
      setLoading(false);
    },
    [zonaId]
  );

  useEffect(() => {
    async function cargarInicial() {
      setLoading(true);
      try {
        const data = await getSensores(zonaId);
        onSensores(data);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    cargarInicial();
    socket.on("sensores", onSensores);
    return () => socket.off("sensores", onSensores);
  }, [zonaId, onSensores]);

  return { sensores, ultimaLectura, loading, error, zonaId };
}
