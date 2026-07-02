import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { login as apiLogin, logoutApi, getMe } from "../api/client.js";
import { disconnectSocket } from "../socket.js";

const STORAGE_KEY = "invernadero_token";
const USER_KEY = "invernadero_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(Boolean(localStorage.getItem(STORAGE_KEY)));

  const login = useCallback(async (usuario, password) => {
    setLoading(true);
    try {
      const data = await apiLogin(usuario, password);
      localStorage.setItem(STORAGE_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify({ usuario: data.usuario, rol: data.rol }));
      setToken(data.token);
      setUser({ usuario: data.usuario, rol: data.rol });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setValidating(false);
      return;
    }

    let cancel = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancel) {
          const u = { usuario: me.usuario, rol: me.rol };
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        }
      } catch {
        if (!cancel) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancel) {
          setValidating(false);
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [token]);

  useEffect(() => {
    function onForcedLogout() {
      setToken(null);
      setUser(null);
      disconnectSocket();
    }
    window.addEventListener("auth:logout", onForcedLogout);
    return () => window.removeEventListener("auth:logout", onForcedLogout);
  }, []);

  const isAdmin = user?.rol === "admin";
  const isAuthenticated = Boolean(token) && !validating;

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, loading, validating, isAdmin, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEY);
}
