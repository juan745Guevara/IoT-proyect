import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RequireAuth({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, validating } = useAuth();
  const location = useLocation();

  if (validating) {
    return <p className="config-hint">Verificando sesión…</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
