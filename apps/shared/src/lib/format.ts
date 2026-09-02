/**
 * LIKASLENS SHARED FORMATTING UTILITIES
 *
 * Single source of truth for date, currency, and number formatting.
 * Every app should import from here instead of writing inline toLocaleString calls.
 *
 * All functions use the user's browser locale by default (`undefined`) but accept
 * an explicit locale override for consistency (e.g. for PDF export).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Date formatting
// ─────────────────────────────────────────────────────────────────────────────

type DateStyle =
  | "short"        // "Jun 15"
  | "short-year"   // "Jun 15, 2024"
  | "medium"       // "June 15, 2024"
  | "long"         // "Monday, June 15, 2024"
  | "month-year"   // "June 2024"
  | "month-day"    // "Jun 15"
  | "weekday"      // "Monday"
  | "relative"     // "2 hours ago", "yesterday"
  | "datetime"     // "Jun 15, 2024, 10:30 AM"
  | "iso"          // "2024-06-15"
  | "time"         // "10:30 AM"
  | "compact";     // "06/15/2024"

/**
 * Format a date string or timestamp into a human-readable string.
 *
 * @example
 *   formatDate("2024-06-15T10:30:00Z", "medium")   // "June 15, 2024"
 *   formatDate(ticket.created_at, "relative")       // "2 hours ago"
 *   formatDate(Date.now(), "long")                  // "Monday, June 15, 2024"
 */
export function formatDate(
  date: string | number | Date | null | undefined,
  style: DateStyle = "short",
  locale?: string
): string {
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  const loc = locale || undefined; // undefined = browser locale
  // Default to Philippine Time (UTC+8) for consistent display across all apps
  const tz = "Asia/Manila";

  switch (style) {
    case "short":
      return d.toLocaleDateString(loc, { month: "short", day: "numeric", timeZone: tz });

    case "short-year":
      return d.toLocaleDateString(loc, {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: tz,
      });

    case "medium":
      return d.toLocaleDateString(loc, {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: tz,
      });

    case "long":
      return d.toLocaleDateString(loc, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: tz,
      });

    case "month-year":
      return d.toLocaleDateString(loc, { month: "long", year: "numeric", timeZone: tz });

    case "month-day":
      return d.toLocaleDateString(loc, { month: "short", day: "numeric", timeZone: tz });

    case "weekday":
      return d.toLocaleDateString(loc, { weekday: "long", timeZone: tz });

    case "datetime":
      return d.toLocaleString(loc, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: tz,
      });

    case "iso":
      return d.toISOString().split("T")[0];

    case "time":
      return d.toLocaleTimeString(loc, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: tz,
      });

    case "compact":
      return d.toLocaleDateString(loc, { timeZone: tz });

    case "relative":
      return formatRelativeTime(d, loc);

    default:
      return d.toLocaleDateString(loc, { timeZone: tz });
  }
}

/**
 * Format a date as a relative time string ("2 hours ago", "yesterday", etc.).
 */
function formatRelativeTime(date: Date, locale?: string): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  // Try Intl.RelativeTimeFormat for locale-aware output
  try {
    const rtf = new Intl.RelativeTimeFormat(locale || undefined, {
      numeric: "auto",
    });

    if (diffSec < 60) return rtf.format(-diffSec, "second");
    if (diffMin < 60) return rtf.format(-diffMin, "minute");
    if (diffHr < 24) return rtf.format(-diffHr, "hour");
    if (diffDays < 7) return rtf.format(-diffDays, "day");
    if (diffWeeks < 5) return rtf.format(-diffWeeks, "week");
    if (diffMonths < 12) return rtf.format(-diffMonths, "month");
    return rtf.format(-Math.floor(diffMonths / 12), "year");
  } catch {
    // Fallback if Intl.RelativeTimeFormat is not available
    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(locale || undefined, {
      month: "short",
      day: "numeric",
      timeZone: "Asia/Manila",
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Number formatting
// ─────────────────────────────────────────────────────────────────────────────

type NumberStyle = "decimal" | "compact" | "ordinal" | "percent";

interface FormatNumberOptions {
  /** Maximum digits after decimal point. Default: 0 */
  maxFraction?: number;
  /** Minimum digits after decimal point. Default: 0 */
  minFraction?: number;
  /** Style override. Default: "decimal" */
  style?: NumberStyle;
}

/**
 * Format a number with locale-aware separators.
 *
 * @example
 *   formatNumber(1234567)              // "1,234,567"
 *   formatNumber(1234.567, { maxFraction: 2 })  // "1,234.57"
 *   formatNumber(1500000, { style: "compact" }) // "1.5M"
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: FormatNumberOptions,
  locale?: string
): string {
  const num = Number(value);
  if (value == null || Number.isNaN(num)) return "—";

  const loc = locale || undefined;
  const { maxFraction = 0, minFraction = 0, style = "decimal" } = options || {};

  if (style === "compact") {
    try {
      return new Intl.NumberFormat(loc, {
        notation: "compact",
        maximumFractionDigits: maxFraction || 1,
      }).format(num);
    } catch {
      return num.toLocaleString(loc);
    }
  }

  if (style === "percent") {
    return new Intl.NumberFormat(loc, {
      style: "percent",
      maximumFractionDigits: maxFraction,
      minimumFractionDigits: minFraction,
    }).format(num / 100);
  }  if (style === "ordinal") {
      try {
        // Intl.PluralRules w/ ordinal is widely supported;
        // the type cast is needed because TS lib doesn't include `style: "ordinal"`
        // in NumberFormatOptions even though V8/SpiderMonkey support it.
        const rules = new Intl.PluralRules(loc || "en", { type: "ordinal" });
        const rule = rules.select(num);
        const suffixMap: Record<string, string> = {
          one: "st",
          two: "nd",
          few: "rd",
          other: "th",
          zero: "th",
          many: "th",
        };
        return `${num}${suffixMap[rule] || "th"}`;
      } catch {
        // Fallback for older browsers
        const suffixes = ["th", "st", "nd", "rd"];
        const v = num % 100;
        const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
        return `${num}${suffix}`;
      }
    }

  return num.toLocaleString(loc, {
    maximumFractionDigits: maxFraction,
    minimumFractionDigits: minFraction,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency formatting
// ─────────────────────────────────────────────────────────────────────────────

interface FormatCurrencyOptions {
  /** Currency code. Default: "PHP" */
  currency?: string;
  /** Maximum fraction digits. Default: 2 */
  maxFraction?: number;
  /** Display style. Default: "symbol" */
  display?: "symbol" | "code" | "name";
  /** Show sign for positive values. Default: false */
  showSign?: boolean;
}

/**
 * Format a number as a currency string.
 *
 * @example
 *   formatCurrency(1500)                    // "₱1,500.00"
 *   formatCurrency(1500.5, { currency: "USD" }) // "$1,500.50"
 *   formatCurrency(0, { currency: "VND" })  // "₫0"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options?: FormatCurrencyOptions,
  locale?: string
): string {
  const num = Number(amount);
  if (amount == null || Number.isNaN(num)) return "—";

  const loc = locale || undefined;
  const {
    currency = "PHP",
    maxFraction = 2,
    display = "symbol",
    showSign = false,
  } = options || {};

  try {
    const formatted = new Intl.NumberFormat(loc, {
      style: "currency",
      currency,
      currencyDisplay: display,
      minimumFractionDigits: currency === "VND" ? 0 : maxFraction,
      maximumFractionDigits: currency === "VND" ? 0 : maxFraction,
      signDisplay: showSign ? "exceptZero" : "auto",
    }).format(num);
    return formatted;
  } catch {
    // Fallback if currency not supported by Intl
    const symbols: Record<string, string> = {
      PHP: "₱",
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      VND: "₫",
      IDR: "Rp",
      SGD: "S$",
      MYR: "RM",
      THB: "฿",
    };
    const sym = symbols[currency] || currency;
    const val = num.toLocaleString(loc, {
      maximumFractionDigits: maxFraction,
      minimumFractionDigits: currency === "VND" ? 0 : maxFraction,
    });
    return `${sym}${val}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Eco-credit display
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format eco-credit points with the "pts" suffix.
 *
 * @example
 *   formatEcoCredits(1500)  // "1,500 pts"
 *   formatEcoCredits(0)     // "0 pts"
 */
export function formatEcoCredits(
  value: number | string | null | undefined,
  locale?: string
): string {
  const num = Number(value);
  if (value == null || Number.isNaN(num)) return "—";
  return `${formatNumber(num, { maxFraction: 0 }, locale)} pts`;
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "just now").
 */
export function formatDistanceToNow(
  date: Date | string,
  options: { locale?: string } = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const now = Date.now();
  const diff = now - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString(options.locale || "en", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

/**
 * Format a duration in minutes into a concise, human-readable string (e.g., "45m", "2.5h", "23d").
 * Avoids displaying raw, confusing minute counts like "32809m".
 *
 * @example
 *   formatDuration(45)       // "45m"
 *   formatDuration(150)      // "2.5h"
 *   formatDuration(32809)    // "23d"
 *   formatDuration(0)        // "—"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || Number.isNaN(minutes) || minutes <= 0) return "—";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) {
    const formattedHours = hours % 1 === 0 ? String(hours) : hours.toFixed(1);
    return `${formattedHours}h`;
  }
  const days = hours / 24;
  if (days < 10) {
    const formattedDays = days % 1 === 0 ? String(days) : days.toFixed(1);
    return `${formattedDays}d`;
  }
  return `${Math.round(days)}d`;
}
