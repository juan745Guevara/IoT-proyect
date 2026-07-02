import { useState, useEffect, useCallback } from "react";
import { getAutomatico, guardarAutomatico, setModoAutomatico } from "../api/client.js";
import socket from "../socket.js";
import { useZonaActiva } from "../context/ZonaContext.jsx";

const DEFAULT = {
  ventilador: {
    modo: "manual",
    activar_si: { sensor: "temperatura", operador: ">=", valor: 36 },
    desactivar_si: { sensor: "temperatura", operador: "<", valor: 33 },
  },
  bomba: {
    modo: "manual",
    activar_si: { sensor: "humedad_suelo", operador: "<=", valor: 30 },
    desactivar_si: { sensor: "humedad_suelo", operador: ">", valor: 40 },
  },
};

export function useAutomatico() {
  const { zonaId } = useZonaActiva();
  const [config, setConfig] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onAutomatico = useCallback(
    (payload) => {
      if (payload.zona_id && payload.zona_id !== zonaId) {
        return;
      }
      const data = payload.config ?? payload;
      setConfig({ ...DEFAULT, ...data });
      setError(null);
      setLoading(false);
    },
    [zonaId]
  );

  useEffect(() => {
    async function cargarInicial() {
      setLoading(true);
      try {
        const data = await getAutomatico(zonaId);
        setConfig({ ...DEFAULT, ...(data.config ?? data) });
        setError(null);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    cargarInicial();
    socket.on("automatico", onAutomatico);
    return () => socket.off("automatico", onAutomatico);
  }, [zonaId, onAutomatico]);

  const setModo = useCallback(
    async (actuador, modo) => {
      setError(null);
      const data = await setModoAutomatico(actuador, modo, zonaId);
      setConfig(data.config ?? data);
      return data;
    },
    [zonaId]
  );

  const guardarConfig = useCallback(
    async (actuador, datos) => {
      setError(null);
      const data = await guardarAutomatico(actuador, datos, zonaId);
      setConfig(data.config ?? data);
      return data;
    },
    [zonaId]
  );

  return { config, setModo, guardarConfig, loading, error, zonaId };
}
