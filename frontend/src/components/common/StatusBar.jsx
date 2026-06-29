import { useState, useEffect } from "react";

export default function StatusBar({ ultimaLectura, alertas = [] }) {
  const [relativo, setRelativo] = useState("—");
  const conectado = ultimaLectura && Date.now() - new Date(ultimaLectura).getTime() < 15000;

  useEffect(() => {
    function calc() {
      if (!ultimaLectura) {
        setRelativo("sin datos");
        return;
      }
      const seg = Math.floor((Date.now() - new Date(ultimaLectura).getTime()) / 1000);
      if (seg < 5) setRelativo("ahora mismo");
      else if (seg < 60) setRelativo(`hace ${seg}s`);
      else setRelativo(`hace ${Math.floor(seg / 60)}min`);
    }

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [ultimaLectura]);

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <div className={`sb-dot ${conectado ? "sb-dot-ok" : "sb-dot-err"}`} />
        <span className={`sb-chip ${conectado ? "sb-chip-ok" : "sb-chip-err"}`}>
          {conectado ? "ESP32 conectado" : "Sin señal"}
        </span>
        {alertas.length > 0 && (
          <span className="sb-chip sb-chip-warn">
            {alertas.length} alerta{alertas.length > 1 ? "s" : ""}
          </span>
        )}
        <span className="sb-time">· última lectura: {relativo}</span>
      </div>
    </div>
  );
}
