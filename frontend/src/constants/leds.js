export const LED_NAMES = ["rojo", "verde", "azul"];

export const LED_LABELS = {
  rojo: "Rojo",
  verde: "Verde",
  azul: "Azul",
};

export const LED_STATE = {
  ON: "ON",
  OFF: "OFF",
};

export const INITIAL_LED_STATE = Object.fromEntries(
  LED_NAMES.map((nombre) => [nombre, LED_STATE.OFF])
);
