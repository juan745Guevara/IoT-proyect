/**
 * Pantalla principal — único componente que usa hooks.
 * Orquesta datos y los pasa a componentes visuales.
 */

import { useLeds } from "../hooks/useLeds.js";
import { useConexion } from "../hooks/useConexion.js";
import StatusBar from "./StatusBar.jsx";
import LedCard from "./LedCard.jsx";

const LEDS = ["rojo", "verde", "azul"];

export default function Dashboard() {
  const { leds, cargando, ledCargando, error, toggleLed } = useLeds();
  const { conectado, verificando } = useConexion();

  return (
    <div className="dashboard">
      <header>
        <h1>SmartHome — Control de LEDs</h1>
        <StatusBar conectado={conectado} verificando={verificando} />
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
      </header>

      <main className="cards">
        {LEDS.map((nombre) => (
          <LedCard
            key={nombre}
            nombre={nombre}
            estado={leds[nombre]}
            cargando={ledCargando === nombre || (cargando && ledCargando === null)}
            onToggle={() => toggleLed(nombre)}
          />
        ))}
      </main>
    </div>
  );
}
