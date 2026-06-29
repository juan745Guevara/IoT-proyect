import { useSensores } from "../../hooks/useSensores.js";
import { useActuadores } from "../../hooks/useActuadores.js";
import GreenhouseView from "./GreenhouseView.jsx";
import SensorCard from "../common/SensorCard.jsx";
import ActuadorCard from "../common/ActuadorCard.jsx";
import AlertBar from "../common/AlertBar.jsx";
import StatusBar from "../common/StatusBar.jsx";

export default function Dashboard() {
  const { sensores, ultimaLectura } = useSensores();
  const { actuadores, toggleActuador } = useActuadores();

  return (
    <div className="dashboard">
      <StatusBar ultimaLectura={ultimaLectura} />
      <AlertBar sensores={sensores} />
      <GreenhouseView sensores={sensores} actuadores={actuadores} />

      <h2 className="sec-label">Lecturas en detalle</h2>
      <div className="sensor-grid">
        <SensorCard
          label="Temperatura"
          valor={sensores?.temperatura}
          unidad="°C"
          icono="ti-temperature"
          barColor="var(--gh-green-mid)"
          max={40}
        />
        <SensorCard
          label="Humedad del aire"
          valor={sensores?.humedad_aire}
          unidad="%"
          icono="ti-droplet"
          barColor="var(--gh-blue-mid)"
          max={100}
        />
        <SensorCard
          label="Humedad del suelo"
          valor={sensores?.humedad_suelo}
          unidad="%"
          icono="ti-plant"
          barColor="var(--gh-amber-mid)"
          max={100}
        />
        <SensorCard
          label="Luminosidad"
          valor={sensores?.luminosidad}
          unidad="%"
          icono="ti-sun"
          barColor="var(--gh-amber-mid)"
          max={100}
        />
      </div>

      <h2 className="sec-label">Control de actuadores</h2>
      <div className="act-grid">
        <ActuadorCard
          actuador={{ id: "ventilador", label: "Ventilador", icono: "ti-wind" }}
          estado={actuadores?.ventilador}
          onToggle={toggleActuador}
        />
        <ActuadorCard
          actuador={{ id: "bomba", label: "Bomba de agua", icono: "ti-ripple" }}
          estado={actuadores?.bomba}
          onToggle={toggleActuador}
        />
      </div>
    </div>
  );
}
