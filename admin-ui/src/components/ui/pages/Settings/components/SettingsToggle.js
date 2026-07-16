const SettingsToggle = ({ checked, onChange, disabled = false, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ring-offset-2 ring-orange-500/20 focus:ring-2 ${
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
    } ${checked ? "bg-[#F59E0B]" : "bg-gray-300"}`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

export default SettingsToggle;
