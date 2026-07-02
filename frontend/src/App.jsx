import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import RequireAuth from "./components/common/RequireAuth.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import Login from "./components/pages/Login.jsx";
import Dashboard from "./components/pages/Dashboard.jsx";
import Historial from "./components/pages/Historial.jsx";
import Alertas from "./components/pages/Alertas.jsx";
import Configuracion from "./components/pages/Configuracion.jsx";
import EstadoESP32 from "./components/pages/EstadoESP32.jsx";
import Admin from "./components/pages/Admin.jsx";

import "./styles/global.css";
import "./styles/layout.css";
import "./styles/components.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="historial" element={<Historial />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="estado" element={<EstadoESP32 />} />
            <Route
              path="admin"
              element={
                <RequireAuth adminOnly>
                  <Admin />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
