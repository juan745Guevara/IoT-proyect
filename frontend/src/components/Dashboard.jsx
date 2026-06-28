/**
 * Pantalla principal — único componente que usa hooks.
 */

import GreenhouseSVG from "./GreenhouseSVG.jsx";
import ActuadorCard from "./ActuadorCard.jsx";
import SensorCard from "./SensorCard.jsx";
import StatusBar from "./StatusBar.jsx";
import { useSensores } from "../hooks/useSensores.js";
import { useActuadores } from "../hooks/useActuadores.js";

export default function Dashboard() {
  const { sensores, ultimaLectura, error: sensoresError } = useSensores();
  const { actuadores, toggleActuador, loading: actuadoresLoading } = useActuadores();

  return (
    <div className="dashboard">
      <StatusBar ultimaLectura={ultimaLectura} />

      {sensoresError && (
        <p className="error-banner" role="alert">
          {sensoresError}
        </p>
      )}

      <GreenhouseSVG sensores={sensores} actuadores={actuadores} />

      <section className="act-section">
        <h2 className="sec-label">Control de actuadores</h2>
        <div className="act-grid">
          <ActuadorCard
            actuador={{ id: "ventilador", label: "Ventilador", icono: "ti-wind" }}
            estado={actuadores.ventilador}
            loading={actuadoresLoading}
            onToggle={toggleActuador}
          />
          <ActuadorCard
            actuador={{ id: "bomba", label: "Bomba de agua", icono: "ti-ripple" }}
            estado={actuadores.bomba}
            loading={actuadoresLoading}
            onToggle={toggleActuador}
          />
        </div>
      </section>

      <section>
        <h2 className="sec-label">Lecturas en detalle</h2>
        <div className="sensor-grid">
          <SensorCard
            id="temperatura"
            label="Temperatura"
            valor={sensores?.temperatura}
            unidad="°C"
            icono="ti-temperature"
            color="var(--gh-green-mid)"
            max={40}
          />
          <SensorCard
            id="humedad_aire"
            label="Humedad del aire"
            valor={sensores?.humedad_aire}
            unidad="%"
            icono="ti-droplet"
            color="var(--gh-blue-mid)"
            max={100}
          />
          <SensorCard
            id="humedad_suelo"
            label="Humedad del suelo"
            valor={sensores?.humedad_suelo}
            unidad="%"
            icono="ti-plant"
            color="var(--gh-amber-mid)"
            max={100}
          />
          <SensorCard
            id="luminosidad"
            label="Luminosidad"
            valor={sensores?.luminosidad}
            unidad="%"
            icono="ti-sun"
            color="var(--gh-amber-mid)"
            max={100}
          />
        </div>
      </section>
    </div>
  );
}
