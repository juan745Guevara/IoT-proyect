const express = require("express");
const bcrypt = require("bcryptjs");
const { autenticar, obtenerPorId, cambiarPassword } = require("../db/users");
const { firmarToken, verificarToken, requireAuth, extraerToken } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimit");
const { agregarToken } = require("../auth/tokenBlacklist");

const router = express.Router();

router.post("/login", loginLimiter, async (req, res) => {
  const { usuario, email, password } = req.body;
  const loginId = usuario || email;

  if (!loginId || !password) {
    return res.status(400).json({ error: "usuario y password requeridos" });
  }

  try {
    const user = await autenticar(loginId, password);
    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = firmarToken(user);
    res.json({
      token,
      usuario: user.usuario,
      rol: user.rol,
    });
  } catch (err) {
    console.error("[Auth] Error login:", err.message);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

router.post("/logout", requireAuth, (req, res) => {
  const token = extraerToken(req);
  try {
    const payload = verificarToken(token);
    const expMs = payload.exp ? payload.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
    agregarToken(token, expMs);
  } catch {
    agregarToken(token);
  }
  res.json({ mensaje: "Sesión cerrada" });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await obtenerPorId(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/cambiar-password", requireAuth, async (req, res) => {
  const { password_actual, password_nuevo } = req.body;

  if (!password_actual || !password_nuevo) {
    return res.status(400).json({ error: "password_actual y password_nuevo requeridos" });
  }
  if (password_nuevo.length < 8) {
    return res.status(400).json({ error: "password_nuevo debe tener al menos 8 caracteres" });
  }

  try {
    const ok = await cambiarPassword(req.user.id, password_actual, password_nuevo);
    if (!ok) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }
    res.json({ mensaje: "Contraseña actualizada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
