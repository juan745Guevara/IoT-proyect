import { useState, useEffect } from "react";
import { getEstadisticasSemana, getEstadisticasSemanas, getPrediccion } from "../api/client.js";
import { useZonaActiva } from "../context/ZonaContext.jsx";

const SENSOR_LABELS = {
  temperatura: "Temperatura",
  humedad_aire: "Humedad aire",
  humedad_suelo: "Humedad suelo",
  luminosidad: "Luminosidad",
};

const UNIDADES = {
  temperatura: "°C",
  humedad_aire: "%",
  humedad_suelo: "%",
  luminosidad: "%",
};

export function useEstadisticas() {
  const { zonaId } = useZonaActiva();
  const [estadisticas, setEstadisticas] = useState([]);
  const [semanas, setSemanas] = useState([]);
  const [prediccion, setPrediccion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;

    async function cargar() {
      setLoading(true);
      try {
        const [stats, sem, pred] = await Promise.all([
          getEstadisticasSemana(zonaId),
          getEstadisticasSemanas(zonaId),
          getPrediccion("temperatura", zonaId),
        ]);
        if (!cancel) {
          setEstadisticas(stats.estadisticas || []);
          setSemanas(sem.semanas || []);
          setPrediccion(pred);
        }
      } catch {
        if (!cancel) {
          setEstadisticas([]);
          setSemanas([]);
          setPrediccion(null);
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    }

    cargar();
    return () => {
      cancel = true;
    };
  }, [zonaId]);

  return { estadisticas, semanas, prediccion, loading, SENSOR_LABELS, UNIDADES };
}

export async function fetchPrediccionSensor(sensor, zonaId) {
  return getPrediccion(sensor, zonaId);
}
