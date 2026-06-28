/**
 * TopBar — conexión ESP32 y tiempo relativo desde última lectura.
 */

import { useState, useEffect } from "react";

function tiempoRelativo(iso) {
  if (!iso) return "sin datos";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 0) return "ahora";
  if (diff < 5) return "ahora";
  if (diff < 60) return `hace ${diff}s`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h`;
}

function esp32Conectado(iso) {
  if (!iso) return false;
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  return diff >= 0 && diff < 15;
}

export default function StatusBar({ ultimaLectura }) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const conectado = esp32Conectado(ultimaLectura);
  const relativo = tiempoRelativo(ultimaLectura);

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-dot" aria-hidden="true" />
        <h1 className="top-bar-title">Invernadero IoT</h1>
      </div>
      <div className="top-bar-right">
        <span className={`esp32-badge ${conectado ? "ok" : "err"}`}>
          {conectado ? "ESP32 conectado" : "ESP32 sin señal"}
        </span>
        <span className="top-bar-time">última lectura: {relativo}</span>
      </div>
    </header>
  );
}
