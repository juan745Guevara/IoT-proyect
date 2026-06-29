import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: "ti-layout-dashboard", label: "Dashboard" },
  { to: "/historial", icon: "ti-chart-line", label: "Historial" },
  { to: "/alertas", icon: "ti-bell", label: "Alertas" },
];

const controlItems = [
  { to: "/configuracion", icon: "ti-adjustments-horizontal", label: "Umbrales" },
  { to: "/estado", icon: "ti-cpu", label: "Estado ESP32" },
];

export default function Sidebar({ conectado }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className={`sidebar-logo-dot ${!conectado ? "sb-dot-err" : ""}`} />
        <span className="sidebar-logo-text">Invernadero IoT</span>
      </div>

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
        >
          <i className={`ti ${item.icon}`} aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}

      <div className="sidebar-section">control</div>
      {controlItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
        >
          <i className={`ti ${item.icon}`} aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}
