/**
 * Hook de lógica de negocio para los LEDs.
 * Sin JSX — reutilizable en React Native copiando este archivo.
 */

import { useState, useEffect, useCallback } from "react";
import { getLeds, toggleLed as apiToggleLed } from "../api/client.js";
import { INITIAL_LED_STATE, LED_STATE } from "../constants/leds.js";

export function useLeds() {
  const [leds, setLeds] = useState(INITIAL_LED_STATE);
  const [cargando, setCargando] = useState(false);
  const [ledCargando, setLedCargando] = useState(null);
  const [error, setError] = useState(null);

  const cargarEstado = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getLeds();
      setLeds({
        rojo: data.rojo ?? LED_STATE.OFF,
        verde: data.verde ?? LED_STATE.OFF,
        azul: data.azul ?? LED_STATE.OFF,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  const toggleLed = useCallback(
    async (led) => {
      const nuevoEstado =
        leds[led] === LED_STATE.ON ? LED_STATE.OFF : LED_STATE.ON;
      setLedCargando(led);
      setError(null);
      try {
        const data = await apiToggleLed(led, nuevoEstado);
        setLeds((prev) => ({ ...prev, [led]: data.estado }));
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLedCargando(null);
      }
    },
    [leds]
  );

  return { leds, cargando, ledCargando, error, toggleLed, recargar: cargarEstado };
}
