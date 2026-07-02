const SENSORES_VALIDOS = ["temperatura", "humedad_aire", "humedad_suelo", "luminosidad"];
const OPERADORES_VALIDOS = [">=", "<=", "<", ">"];
const MODOS_VALIDOS = ["manual", "automatico"];

function validarCondicion(cond, etiqueta) {
  if (!cond || typeof cond !== "object") {
    return `${etiqueta} es requerido`;
  }
  if (!SENSORES_VALIDOS.includes(cond.sensor)) {
    return `${etiqueta}.sensor inválido`;
  }
  if (!OPERADORES_VALIDOS.includes(cond.operador)) {
    return `${etiqueta}.operador inválido`;
  }
  const valor = Number(cond.valor);
  if (!Number.isFinite(valor) || valor < 0) {
    return `${etiqueta}.valor debe ser un número positivo`;
  }
  return null;
}

function validarConfigActuador(body) {
  if (!MODOS_VALIDOS.includes(body.modo)) {
    return "modo debe ser 'manual' o 'automatico'";
  }

  const errActivar = validarCondicion(body.activar_si, "activar_si");
  if (errActivar) {
    return errActivar;
  }

  const errDesactivar = validarCondicion(body.desactivar_si, "desactivar_si");
  if (errDesactivar) {
    return errDesactivar;
  }

  if (body.activar_si.operador === body.desactivar_si.operador) {
    return "activar_si y desactivar_si no pueden usar el mismo operador";
  }

  return null;
}

module.exports = {
  validarConfigActuador,
  SENSORES_VALIDOS,
  OPERADORES_VALIDOS,
  MODOS_VALIDOS,
};
