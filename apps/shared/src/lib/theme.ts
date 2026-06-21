/**
 * LIKASLENS THEME UTILITY
 *
 * Declares `window.updateThemeColor` (injected by proxy/HTML head script)
 * and provides a typed helper so no file needs `(window as any)`.
 */

declare global {
  interface Window {
    /** Optional callback injected by the theme-initializer script in layout.tsx.
     *  Called after theme changes so the meta theme-color tag can be updated. */
    updateThemeColor?: () => void;
  }
}

/**
 * Safely notify the theme-color meta tag updater that the theme changed.
 * No-op if the callback hasn't been registered (e.g. during SSR).
 */
export function notifyThemeColor(): void {
  window.updateThemeColor?.();
}
