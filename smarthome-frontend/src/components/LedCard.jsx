/**
 * Tarjeta visual de un LED — solo UI.
 * Recibe datos y eventos por props; no conoce la API.
 */

const ETIQUETAS = {
  rojo: "Rojo",
  verde: "Verde",
  azul: "Azul",
};

export default function LedCard({ nombre, estado, cargando, onToggle }) {
  const encendido = estado === "ON";
  const etiqueta = ETIQUETAS[nombre] || nombre;

  return (
    <article className="led-card" data-led={nombre}>
      <h2>{etiqueta}</h2>
      <div
        className={`indicator ${nombre} ${encendido ? "on" : ""}`}
        aria-label={encendido ? "Encendido" : "Apagado"}
      />
      <button
        type="button"
        className={`toggle-btn ${encendido ? "on" : ""}`}
        onClick={onToggle}
        disabled={cargando}
      >
        {cargando ? (
          <span className="spinner" aria-hidden="true" />
        ) : encendido ? (
          "Apagar"
        ) : (
          "Encender"
        )}
      </button>
    </article>
  );
}
