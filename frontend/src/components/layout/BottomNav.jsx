import { NavLink } from "react-router-dom";

const items = [
  { to: "/", icon: "ti-layout-dashboard", label: "Inicio" },
  { to: "/historial", icon: "ti-chart-line", label: "Historial" },
  { to: "/alertas", icon: "ti-bell", label: "Alertas" },
  { to: "/configuracion", icon: "ti-settings", label: "Config" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
        >
          <i className={`ti ${item.icon}`} aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
