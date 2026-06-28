/**
 * Hook de control de actuadores (ventilador, bomba).
 * Sin JSX — reutilizable en React Native copiando este archivo.
 */

import { useState, useEffect, useCallback } from "react";
import { getActuadores, toggleActuador as apiToggleActuador } from "../api/client.js";
import { ESTADO_INICIAL_ACTUADORES, ESTADO } from "../constants/invernadero.js";

export function useActuadores() {
  const [actuadores, setActuadores] = useState(ESTADO_INICIAL_ACTUADORES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await getActuadores();
        setActuadores({
          ventilador: data.ventilador ?? ESTADO.OFF,
          bomba: data.bomba ?? ESTADO.OFF,
        });
      } catch {
        // Estado inicial se mantiene si el backend no responde
      }
    }
    cargar();
  }, []);

  const toggleActuador = useCallback(async (id, nuevoEstado) => {
    setLoading(true);
    try {
      const data = await apiToggleActuador(id, nuevoEstado);
      setActuadores((prev) => ({ ...prev, [id]: data.estado }));
    } finally {
      setLoading(false);
    }
  }, []);

  return { actuadores, toggleActuador, loading };
}
