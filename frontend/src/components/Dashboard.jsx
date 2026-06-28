/**
 * Pantalla principal — único componente que usa hooks.
 * Orquesta datos y los pasa a componentes visuales.
 */

import { SENSORES, ACTUADORES } from "../constants/invernadero.js";
import { useSensores } from "../hooks/useSensores.js";
import { useActuadores } from "../hooks/useActuadores.js";
import { useConexion } from "../hooks/useConexion.js";
import StatusBar from "./StatusBar.jsx";
import SensorCard from "./SensorCard.jsx";
import ActuadorCard from "./ActuadorCard.jsx";

export default function Dashboard() {
  const { sensores, ultimaLectura, loading: sensoresLoading, error: sensoresError } = useSensores();
  const { actuadores, toggleActuador, loading: actuadoresLoading } = useActuadores();
  const { conectado, verificando } = useConexion();

  return (
    <div className="dashboard">
      <header>
        <h1>Invernadero Inteligente</h1>
        <StatusBar
          conectado={conectado}
          verificando={verificando}
          ultimaLectura={ultimaLectura}
        />
        {sensoresError && (
          <p className="error-banner" role="alert">
            {sensoresError}
          </p>
        )}
      </header>

      <section className="seccion-sensores">
        <h2 className="seccion-titulo">Sensores</h2>
        <div className="sensores-grid">
          {SENSORES.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              valor={sensores[sensor.id]}
            />
          ))}
        </div>
        {sensoresLoading && <p className="cargando-texto">Cargando sensores...</p>}
      </section>

      <section className="seccion-actuadores">
        <h2 className="seccion-titulo">Actuadores</h2>
        <div className="actuadores-grid">
          {ACTUADORES.map((actuador) => (
            <ActuadorCard
              key={actuador.id}
              actuador={actuador}
              estado={actuadores[actuador.id]}
              loading={actuadoresLoading}
              onToggle={(nuevoEstado) => toggleActuador(actuador.id, nuevoEstado)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
