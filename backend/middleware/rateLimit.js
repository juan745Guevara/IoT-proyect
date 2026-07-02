const rateLimit = require("express-rate-limit");

function envInt(primary, fallback, defaultVal) {
  return Number(process.env[primary] ?? process.env[fallback]) || defaultVal;
}

const apiLimiter = rateLimit({
  windowMs: envInt("RATE_LIMIT_WINDOW_MS", null, 15 * 60 * 1000),
  max: envInt("RATE_LIMIT_MAX", "RATE_LIMIT_API", 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes, intenta más tarde" },
});

const actuadorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: envInt("RATE_LIMIT_ACTUADOR_MAX", "RATE_LIMIT_ACTUADOR", 30),
  message: { error: "Límite de comandos de actuador alcanzado" },
});

const loginLimiter = rateLimit({
  windowMs: envInt("RATE_LIMIT_WINDOW_MS", null, 15 * 60 * 1000),
  max: envInt("RATE_LIMIT_LOGIN_MAX", "RATE_LIMIT_LOGIN", 5),
  message: { error: "Demasiadas solicitudes, intenta más tarde" },
});

module.exports = { apiLimiter, actuadorLimiter, loginLimiter };
