import { useSensores } from "../../hooks/useSensores.js";
import { useActuadores } from "../../hooks/useActuadores.js";
import StatusBar from "../common/StatusBar.jsx";

export default function EstadoESP32() {
  const { sensores, ultimaLectura } = useSensores();
  const { actuadores } = useActuadores();

  const conectado = ultimaLectura && Date.now() - new Date(ultimaLectura).getTime() < 15000;

  return (
    <div>
      <StatusBar ultimaLectura={ultimaLectura} />
      <h2 className="sec-label">Estado del dispositivo</h2>
      <div className="page-placeholder" style={{ textAlign: "left", padding: "1.5rem" }}>
        <i className="ti ti-cpu" aria-hidden="true" style={{ textAlign: "center" }} />
        <h3 style={{ textAlign: "center" }}>ESP32 — {conectado ? "En línea" : "Sin señal"}</h3>
        <p>
          <strong>Última lectura:</strong> {ultimaLectura ? new Date(ultimaLectura).toLocaleString("es-ES") : "—"}
        </p>
        <p>
          <strong>Temperatura:</strong> {sensores?.temperatura != null ? `${sensores.temperatura}°C` : "—"}
        </p>
        <p>
          <strong>Ventilador:</strong> {actuadores?.ventilador ?? "—"}
        </p>
        <p>
          <strong>Bomba:</strong> {actuadores?.bomba ?? "—"}
        </p>
      </div>
    </div>
  );
}
