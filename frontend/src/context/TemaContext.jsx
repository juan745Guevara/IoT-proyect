import { createContext, useContext } from "react";
import { useTema as useTemaHook } from "../hooks/useTema.js";

const TemaContext = createContext(null);

export function TemaProvider({ children }) {
  const value = useTemaHook();
  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) {
    throw new Error("useTema debe usarse dentro de TemaProvider");
  }
  return ctx;
}
