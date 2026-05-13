type ThemeToggleProps = {
  ghostMode: boolean;
  onToggle: () => void;
};

export function ThemeToggle({ ghostMode, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 rounded-full border px-3 py-1.5 text-sm"
      aria-label="Toggle Ghost Mode"
    >
      <span className="font-body">Ghost Mode</span>
      <span className={`theme-switch ${ghostMode ? "is-on" : ""}`}>
        <span className="theme-switch-dot" />
      </span>
    </button>
  );
}
