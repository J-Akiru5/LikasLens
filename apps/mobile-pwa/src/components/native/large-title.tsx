"use client";

/**
 * LargeTitle — the iOS large-title heading, adapted to this app's shell.
 *
 * The MobileLayout already owns the persistent top chrome (logo, ghost toggle,
 * bell). So unlike a raw iOS screen, the per-page title does NOT add a second
 * collapsing bar — it would duplicate and overlap that header. Instead this is
 * a clean, large editorial heading that opens each screen, with an optional
 * trailing control (chip, refresh, etc.) aligned to its baseline.
 *
 * Reliable over fancy: no absolute bars, no scroll-driven transforms that
 * fought the shell's own scroll container.
 */
interface LargeTitleProps {
  title: string;
  subtitle?: string;
  /** Optional trailing node aligned to the title's baseline (chip, button). */
  trailing?: React.ReactNode;
}

export function LargeTitle({ title, subtitle, trailing }: LargeTitleProps) {
  return (
    <div
      style={{
        paddingTop: 4,
        paddingBottom: 6,
        display: "flex",
        alignItems: trailing ? "flex-end" : "flex-start",
        justifyContent: "space-between",
        gap: 14,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          className="ios-large-title ios-large-title--xl"
          style={{ margin: 0, textWrap: "balance" as const }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--muted)",
              margin: "6px 0 0",
              lineHeight: 1.45,
              maxWidth: "30ch",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {trailing && <div style={{ flexShrink: 0, paddingBottom: 4 }}>{trailing}</div>}
    </div>
  );
}
