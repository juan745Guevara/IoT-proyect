import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import BottomNav from "./BottomNav.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";
import { useConexion } from "../../hooks/useConexion.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ZonaProvider } from "../../context/ZonaContext.jsx";
import { TemaProvider } from "../../context/TemaContext.jsx";
import { connectSocket, disconnectSocket } from "../../socket.js";

export default function AppLayout() {
  const navigate = useNavigate();
  const { conectado } = useConexion();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    function onForcedLogout() {
      navigate("/login", { replace: true });
    }
    window.addEventListener("auth:logout", onForcedLogout);
    return () => window.removeEventListener("auth:logout", onForcedLogout);
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [isAuthenticated]);

  return (
    <TemaProvider>
      <ZonaProvider>
        <div className="app-shell">
          <Sidebar conectado={conectado} />
          <main className="main-content">
            <div className="mobile-top-bar">
              <ThemeToggle compact />
            </div>
            <div className="page-content">
              <Outlet />
            </div>
          </main>
          <BottomNav />
        </div>
      </ZonaProvider>
    </TemaProvider>
  );
}
