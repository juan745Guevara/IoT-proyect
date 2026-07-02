import { useState, useEffect, useCallback } from "react";
import { getActuadores, toggleActuador as apiToggleActuador } from "../api/client.js";
import { ESTADO_INICIAL_ACTUADORES, ESTADO } from "../constants/invernadero.js";
import socket from "../socket.js";
import { useZonaActiva } from "../context/ZonaContext.jsx";

function mapActuadores(data) {
  return {
    ventilador: data.ventilador ?? ESTADO.OFF,
    bomba: data.bomba ?? ESTADO.OFF,
  };
}

export function useActuadores() {
  const { zonaId } = useZonaActiva();
  const [actuadores, setActuadores] = useState(ESTADO_INICIAL_ACTUADORES);
  const [loading, setLoading] = useState(false);

  const onActuadores = useCallback(
    (payload) => {
      if (payload.zona_id && payload.zona_id !== zonaId) {
        return;
      }
      const data = payload.datos ?? payload;
      setActuadores(mapActuadores(data));
    },
    [zonaId]
  );

  useEffect(() => {
    async function cargarInicial() {
      try {
        const data = await getActuadores(zonaId);
        onActuadores(data);
      } catch {
        // mantener estado inicial
      }
    }

    cargarInicial();
    socket.on("actuadores", onActuadores);
    return () => socket.off("actuadores", onActuadores);
  }, [zonaId, onActuadores]);

  const toggleActuador = useCallback(
    async (id, nuevoEstado) => {
      setLoading(true);
      try {
        await apiToggleActuador(id, nuevoEstado, zonaId);
      } finally {
        setLoading(false);
      }
    },
    [zonaId]
  );

  return { actuadores, toggleActuador, loading, zonaId };
}
