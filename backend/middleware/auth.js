const jwt = require("jsonwebtoken");
const { estaEnBlacklist } = require("../auth/tokenBlacklist");

const JWT_SECRET = process.env.JWT_SECRET || "cambiar-en-produccion-invernadero-iot";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRY || "24h";
function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, usuario: usuario.usuario, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function extraerToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = extraerToken(req);
  if (!token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  if (estaEnBlacklist(token)) {
    return res.status(401).json({ error: "Sesión cerrada" });
  }

  try {
    req.user = verificarToken(token);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
function requireAdmin(req, res, next) {
  if (req.user?.rol !== "admin") {
    return res.status(403).json({ error: "Sin permisos" });
  }
  next();
}

function requireWrite(req, res, next) {
  if (req.user?.rol !== "admin") {
    return res.status(403).json({ error: "Sin permisos" });
  }
  next();
}
module.exports = {
  firmarToken,
  verificarToken,
  extraerToken,
  requireAuth,
  requireAdmin,
  requireWrite,
  JWT_SECRET,
};
