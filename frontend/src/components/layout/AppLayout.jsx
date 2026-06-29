import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import BottomNav from "./BottomNav.jsx";
import { useSensores } from "../../hooks/useSensores.js";

export default function AppLayout() {
  const { ultimaLectura } = useSensores();
  const conectado = ultimaLectura && Date.now() - new Date(ultimaLectura).getTime() < 15000;

  return (
    <div className="app-shell">
      <Sidebar conectado={conectado} />
      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
