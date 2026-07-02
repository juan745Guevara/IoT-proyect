const { Server } = require("socket.io");
const { verificarToken } = require("./middleware/auth");
const { estaEnBlacklist } = require("./auth/tokenBlacklist");

let io = null;

function initSocket(httpServer) {
  const corsOrigin = process.env.FRONTEND_URL || "*";

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("No autenticado"));
    }
    if (estaEnBlacklist(token)) {
      return next(new Error("Sesión cerrada"));
    }
    try {
      socket.usuario = verificarToken(token);
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.log("[Socket] Cliente conectado:", socket.id, socket.usuario?.usuario || "");
    socket.on("disconnect", () => {
      console.log("[Socket] Cliente desconectado:", socket.id);
    });
  });

  console.log("[Socket] Socket.io inicializado");
  return io;
}

function emitSensores(zona_id, datos) {
  io?.emit("sensores", { zona_id, datos });
}

function emitActuadores(zona_id, datos) {
  io?.emit("actuadores", { zona_id, datos });
}

function emitUmbrales(zona_id, datos) {
  io?.emit("umbrales", { zona_id, datos });
}

function emitAutomatico(zona_id, datos) {
  io?.emit("automatico", { zona_id, config: datos });
}

function emitEstadoZonas(datos) {
  io?.emit("estado_zonas", datos);
}

function emitLogAccion(entrada) {
  io?.emit("log_accion", entrada);
}

function emitAlerta(alerta) {
  io?.emit("alerta", alerta);
}

function emitAnomalia(payload) {
  io?.emit("anomalia", payload);
}

module.exports = {
  initSocket,
  emitSensores,
  emitActuadores,
  emitUmbrales,
  emitAutomatico,
  emitEstadoZonas,
  emitLogAccion,
  emitAlerta,
  emitAnomalia,
};
