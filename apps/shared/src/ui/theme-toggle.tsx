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
      className="flex items-center gap-3 rounded-full border border-border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label={`Turn ${ghostMode ? "off" : "on"} Ghost Mode`}
      aria-pressed={ghostMode}
    >
      <span>Ghost Mode</span>
      <span
        className={`relative inline-flex h-[1.5rem] w-[2.8rem] items-center rounded-full border border-border transition-colors duration-200 ${
          ghostMode ? "bg-accent/25" : "bg-ink/10"
        }`}
      >
        <span
          className={`inline-block h-[1.1rem] w-[1.1rem] rounded-full bg-panel transition-transform duration-200 ${
            ghostMode ? "translate-x-[1.25rem]" : "translate-x-[0.1rem]"
          }`}
        />
      </span>
    </button>
  );
}
