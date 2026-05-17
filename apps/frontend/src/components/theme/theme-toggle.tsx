type ThemeToggleProps = {
  ghostMode: boolean;
  onToggle: () => void;
};

export function ThemeToggle({ ghostMode, onToggle }: ThemeToggleProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className="flex items-center gap-3 rounded-full border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      aria-label={`Turn ${ghostMode ? "off" : "on"} Ghost Mode`}
      aria-pressed={ghostMode}
    >
      <span className="font-body">Ghost Mode</span>
      <span className={`theme-switch ${ghostMode ? "is-on" : ""}`}>
        <span className="theme-switch-dot" />
      </span>
    </button>
  );
}
