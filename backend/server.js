const { PORT } = require("./config");
const app = require("./app");

app.listen(PORT, () => {
  console.log(`[HTTP] Servidor escuchando en http://localhost:${PORT}`);
});
