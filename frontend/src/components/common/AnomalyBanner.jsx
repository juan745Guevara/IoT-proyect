import { useState, useEffect } from "react";
import socket from "../../socket.js";
import { useZonaActiva } from "../../context/ZonaContext.jsx";

export default function AnomalyBanner() {
  const { zonaId } = useZonaActiva();
  const [anomalia, setAnomalia] = useState(null);

  useEffect(() => {
    let timer;
    function onAnomalia(payload) {
      if (payload.zona_id && payload.zona_id !== zonaId) {
        return;
      }
      setAnomalia(payload);
      clearTimeout(timer);
      timer = setTimeout(() => setAnomalia(null), 10000);
    }
    socket.on("anomalia", onAnomalia);
    return () => {
      socket.off("anomalia", onAnomalia);
      clearTimeout(timer);
    };
  }, [zonaId]);

  if (!anomalia) {
    return null;
  }

  return (
    <div className="anomaly-banner" role="alert">
      <i className="ti ti-alert-triangle" aria-hidden="true" />
      <span>{anomalia.mensaje}</span>
    </div>
  );
}
