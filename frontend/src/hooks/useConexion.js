/**
 * Hook de conexión basado en Socket.io.
 */

import { useState, useEffect } from "react";
import socket from "../socket.js";

export function useConexion() {
  const [conectado, setConectado] = useState(socket.connected);
  const [verificando, setVerificando] = useState(!socket.connected);

  useEffect(() => {
    function onConnect() {
      setConectado(true);
      setVerificando(false);
    }

    function onDisconnect() {
      setConectado(false);
      setVerificando(false);
    }

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { conectado, verificando };
}
