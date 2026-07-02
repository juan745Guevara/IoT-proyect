import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "tema";

function temaInicial() {
  const guardado = localStorage.getItem(STORAGE_KEY);
  if (guardado === "light" || guardado === "dark") {
    return guardado;
  }
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function aplicarTema(tema) {
  document.documentElement.setAttribute("data-theme", tema);
  document.documentElement.style.colorScheme = tema === "dark" ? "dark" : "light";
}

export function useTema() {
  const [tema, setTemaState] = useState(() => {
    const t = temaInicial();
    aplicarTema(t);
    return t;
  });

  useEffect(() => {
    aplicarTema(tema);
    localStorage.setItem(STORAGE_KEY, tema);
  }, [tema]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange(e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTemaState(e.matches ? "dark" : "light");
      }
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleTema = useCallback(() => {
    setTemaState((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const setTema = useCallback((nuevo) => {
    setTemaState(nuevo);
  }, []);

  return { tema, toggleTema, setTema };
}
