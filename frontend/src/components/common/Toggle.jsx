export default function Toggle({ on, onChange, disabled, ariaLabel }) {
  return (
    <button
      type="button"
      className={`toggle ${on ? "toggle-on" : "toggle-off"}`}
      onClick={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={on}
    />
  );
}
