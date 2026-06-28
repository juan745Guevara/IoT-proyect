const { PORT } = require("./config");
const app = require("./app");

// Inicializa cliente MQTT (suscripción a sensores)
require("./mqtt/client");

app.listen(PORT, () => {
  console.log(`[HTTP] Servidor escuchando en http://localhost:${PORT}`);
});
