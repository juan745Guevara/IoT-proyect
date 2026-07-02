import { useTema } from "../../context/TemaContext.jsx";

export default function ThemeToggle({ compact = false, className = "" }) {
  const { tema, toggleTema } = useTema();
  const esOscuro = tema === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${compact ? "theme-toggle-btn--compact" : ""} ${className}`.trim()}
      onClick={toggleTema}
      aria-label={esOscuro ? "Activar modo claro" : "Activar modo oscuro"}
      title={esOscuro ? "Modo claro" : "Modo oscuro"}
    >
      <i className={`ti ${esOscuro ? "ti-sun" : "ti-moon"}`} aria-hidden="true" />
      {!compact && <span>{esOscuro ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
