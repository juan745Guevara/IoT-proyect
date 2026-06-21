const path = require("path");
const fs = require("fs");
const express = require("express");

const DIST_PATH = path.join(__dirname, "..", "frontend", "dist");

function registrarFrontend(app) {
  if (!fs.existsSync(DIST_PATH)) {
    console.log(
      "[HTTP] Frontend no compilado. Desarrollo: cd frontend && npm run dev | Producción: npm run build"
    );
    return;
  }

  app.use(express.static(DIST_PATH));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(DIST_PATH, "index.html"));
  });

  console.log("[HTTP] Sirviendo frontend desde frontend/dist");
}

module.exports = { registrarFrontend };
