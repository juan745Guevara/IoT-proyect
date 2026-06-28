/**
 * Hook que comprueba si el servidor responde.
 * Sin JSX — reutilizable en React Native.
 */

import { useState, useEffect } from "react";
import { getSensores } from "../api/client.js";

const INTERVALO_MS = 5000;

export function useConexion() {
  const [conectado, setConectado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function verificar() {
      try {
        await getSensores();
        if (activo) setConectado(true);
      } catch {
        if (activo) setConectado(false);
      } finally {
        if (activo) setVerificando(false);
      }
    }

    verificar();
    const id = setInterval(verificar, INTERVALO_MS);

    return () => {
      activo = false;
      clearInterval(id);
    };
  }, []);

  return { conectado, verificando };
}
