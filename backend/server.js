require("dotenv").config();

const http = require("http");
const { PORT } = require("./config");
const app = require("./app");
const { initSocket } = require("./socket");
const { initPool, verificarConexion } = require("./db/index");
const { initSchema } = require("./db/historial");
const { initUsuarios } = require("./db/users");
const { iniciarLimpieza } = require("./jobs/limpieza");
const { iniciarMonitoreoConexion } = require("./jobs/conexion");
const { iniciarScheduler } = require("./jobs/scheduler");
const { iniciarBackup } = require("./jobs/backup");
const { registrarZona } = require("./state/invernadero");

async function start() {
  initPool();
  await verificarConexion();
  await initSchema();
  await initUsuarios();

  registrarZona("zona1");

  const server = http.createServer(app);
  initSocket(server);

  require("./mqtt/client");
  iniciarLimpieza();
  iniciarMonitoreoConexion();
  iniciarScheduler();
  iniciarBackup();

  server.listen(PORT, () => {
    console.log(`[HTTP] Servidor escuchando en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("[HTTP] Error al iniciar:", err.message);
  process.exit(1);
});
