import { useSensores } from "../../hooks/useSensores.js";
import { useActuadores } from "../../hooks/useActuadores.js";
import { useUmbrales } from "../../hooks/useUmbrales.js";
import { useAutomatico } from "../../hooks/useAutomatico.js";
import { useAuth } from "../../context/AuthContext.jsx";
import GreenhouseView from "./GreenhouseView.jsx";
import SensorCard from "../common/SensorCard.jsx";
import ActuadorCard from "../common/ActuadorCard.jsx";
import AlertBar from "../common/AlertBar.jsx";
import AnomalyBanner from "../common/AnomalyBanner.jsx";
import StatusBar from "../common/StatusBar.jsx";

import ZonaSelector from "../common/ZonaSelector.jsx";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { sensores, ultimaLectura } = useSensores();
  const { actuadores, toggleActuador } = useActuadores();
  const { umbrales } = useUmbrales();
  const { config: autoConfig } = useAutomatico();

  return (
    <div className="dashboard">
      <div className="page-head-row">
        <ZonaSelector />
      </div>
      <StatusBar ultimaLectura={ultimaLectura} />
      {!isAdmin && (
        <p className="readonly-banner">
          <i className="ti ti-eye" aria-hidden="true" /> Modo solo lectura — no puedes controlar actuadores
        </p>
      )}
      <AlertBar sensores={sensores} umbrales={umbrales} />
      <AnomalyBanner />
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
          actuador={{ id: "ventilador", label: "Ventilación", icono: "ti-wind" }}
          estado={actuadores?.ventilador}
          onToggle={toggleActuador}
          modoAutomatico={autoConfig?.ventilador?.modo === "automatico"}
          readOnly={!isAdmin}
        />
        <ActuadorCard
          actuador={{ id: "bomba", label: "Riego", icono: "ti-ripple" }}
          estado={actuadores?.bomba}
          onToggle={toggleActuador}
          modoAutomatico={autoConfig?.bomba?.modo === "automatico"}
          readOnly={!isAdmin}
        />
      </div>
    </div>
  );
}
