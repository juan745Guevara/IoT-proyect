const express = require("express");
const cors = require("./middleware/cors");
const apiRoutes = require("./routes/api");
const { registrarFrontend } = require("./static");

const app = express();

app.use(cors);
app.use(express.json());
app.use("/api", apiRoutes);
registrarFrontend(app);

module.exports = app;
