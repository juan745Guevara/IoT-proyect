/**
 * Hook de lectura de sensores con polling cada 5 segundos.
 * Sin JSX — reutilizable en React Native copiando este archivo.
 */

import { useState, useEffect, useCallback } from "react";
import { getSensores } from "../api/client.js";

const INTERVALO_MS = 5000;

export function useSensores() {
  const [sensores, setSensores] = useState({
    temperatura: null,
    humedad_aire: null,
    humedad_suelo: null,
    luminosidad: null,
  });
  const [ultimaLectura, setUltimaLectura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarSensores = useCallback(async () => {
    setError(null);
    try {
      const data = await getSensores();
      setSensores({
        temperatura: data.temperatura ?? null,
        humedad_aire: data.humedad_aire ?? null,
        humedad_suelo: data.humedad_suelo ?? null,
        luminosidad: data.luminosidad ?? null,
      });
      setUltimaLectura(data.ultima_lectura ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarSensores();
    const id = setInterval(cargarSensores, INTERVALO_MS);
    return () => clearInterval(id);
  }, [cargarSensores]);

  return { sensores, ultimaLectura, loading, error };
}
