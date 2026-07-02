import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ZONA_DEFAULT } from "../api/client.js";

const STORAGE_KEY = "zona_preferida";

const ZonaContext = createContext(null);

export function ZonaProvider({ children }) {
  const [zonaId, setZonaIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ZONA_DEFAULT
  );

  const setZonaId = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setZonaIdState(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, zonaId);
  }, [zonaId]);

  return (
    <ZonaContext.Provider value={{ zonaId, setZonaId }}>
      {children}
    </ZonaContext.Provider>
  );
}

export function useZonaActiva() {
  const ctx = useContext(ZonaContext);
  if (!ctx) {
    throw new Error("useZonaActiva debe usarse dentro de ZonaProvider");
  }
  return ctx;
}
