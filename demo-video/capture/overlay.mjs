/**
 * In-page overlay for phone capture.
 *
 * Draws only what must live *inside* the recorded pixels: a highlight ring on
 * the control being discussed and a tap ring on each tap. The step chip, the
 * caption bar and the "Demo data" tag are drawn in the 1920x1080 frame by
 * capture/frame-overlay.mjs instead, so their text stays crisp and is not
 * constrained to the phone's width.
 *
 * Everything here is injected into the page at capture time. Nothing is added
 * to the app's own source, and nothing survives the take.
 */

const STYLE_ID = "__avp_overlay_style";
const HIGHLIGHT_ID = "__avp_highlight";

export const OVERLAY_CSS = `
  #${HIGHLIGHT_ID} {
    position: fixed;
    z-index: 2147483000;
    pointer-events: none;
    border: 3px solid #34d399;
    border-radius: 14px;
    box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.25), 0 0 22px rgba(52, 211, 153, 0.55);
    transition: all 220ms ease;
  }
  .__avp_tap {
    position: fixed;
    z-index: 2147483001;
    pointer-events: none;
    width: 26px; height: 26px;
    margin: -13px 0 0 -13px;
    border-radius: 9999px;
    border: 3px solid rgba(52, 211, 153, 0.95);
    background: rgba(52, 211, 153, 0.28);
    animation: __avp_tap 620ms ease-out forwards;
  }
  @keyframes __avp_tap {
    0%   { transform: scale(0.45); opacity: 0.95; }
    100% { transform: scale(2.6);  opacity: 0; }
  }
  /* The Next.js dev indicator must never reach a delivered frame. */
  nextjs-portal, [data-next-badge-root], #__next-build-watcher { display: none !important; }
`;

/** Install the stylesheet and hide the dev chrome. Idempotent per navigation. */
export async function installOverlay(page) {
  await page.addInitScript((css) => {
    const inject = () => {
      if (!document.getElementById("__avp_overlay_style")) {
        const s = document.createElement("style");
        s.id = "__avp_overlay_style";
        s.textContent = css;
        document.head?.appendChild(s);
      }
    };
    if (document.head) inject();
    document.addEventListener("DOMContentLoaded", inject);
  }, OVERLAY_CSS);

  // addInitScript only applies to future navigations; apply now too.
  await page.evaluate((css) => {
    if (!document.getElementById("__avp_overlay_style")) {
      const s = document.createElement("style");
      s.id = "__avp_overlay_style";
      s.textContent = css;
      document.head.appendChild(s);
    }
  }, OVERLAY_CSS);
}

/** Draw a ring around the first element matching `selector`. Returns false if not found. */
export async function highlight(page, selector, holdMs = 2000) {
  const found = await page
    .evaluate(
      ({ sel, id }) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        let box = document.getElementById(id);
        if (!box) {
          box = document.createElement("div");
          box.id = id;
          document.body.appendChild(box);
        }
        Object.assign(box.style, {
          display: "block",
          left: `${Math.max(4, r.left - 8)}px`,
          top: `${Math.max(4, r.top - 8)}px`,
          width: `${Math.min(r.width + 16, window.innerWidth - 8)}px`,
          height: `${r.height + 16}px`,
        });
        return true;
      },
      { sel: selector, id: HIGHLIGHT_ID },
    )
    .catch(() => false);

  if (!found) return false;
  await page.waitForTimeout(holdMs);
  await page
    .evaluate((id) => {
      const b = document.getElementById(id);
      if (b) b.style.display = "none";
    }, HIGHLIGHT_ID)
    .catch(() => {});
  return true;
}

/** Show a tap ring at the element's centre, as if a finger touched it. */
export async function tapRing(page, selector) {
  return page
    .evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const dot = document.createElement("div");
      dot.className = "__avp_tap";
      dot.style.left = `${r.left + r.width / 2}px`;
      dot.style.top = `${r.top + r.height / 2}px`;
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 900);
      return true;
    }, selector)
    .catch(() => false);
}

/** Click and draw the tap ring in one step. */
export async function clickWithRing(page, selector, { timeout = 15000, optional = false } = {}) {
  const loc = page.locator(selector).first();
  try {
    await loc.waitFor({ state: "visible", timeout });
  } catch {
    if (optional) return false;
    throw new Error(`clickWithRing: not visible within ${timeout}ms: ${selector}`);
  }
  await tapRing(page, selector);
  await page.waitForTimeout(120);
  await loc.click({ timeout });
  return true;
}
