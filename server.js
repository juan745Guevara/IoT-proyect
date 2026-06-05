const { PORT } = require("./server/config");
const app = require("./server/app");

app.listen(PORT, () => {
  console.log(`[HTTP] Servidor escuchando en http://localhost:${PORT}`);
});
