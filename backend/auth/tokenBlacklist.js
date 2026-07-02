const blacklist = new Map();

function agregarToken(token, expMs) {
  if (!token) return;
  blacklist.set(token, expMs || Date.now() + 24 * 60 * 60 * 1000);
}

function estaEnBlacklist(token) {
  limpiarExpirados();
  return blacklist.has(token);
}

function limpiarExpirados() {
  const ahora = Date.now();
  for (const [token, exp] of blacklist) {
    if (exp <= ahora) {
      blacklist.delete(token);
    }
  }
}

module.exports = { agregarToken, estaEnBlacklist, limpiarExpirados };
