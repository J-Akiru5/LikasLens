# Design

## Theme

Two modes, same DNA. **Civic Mode** (light) is clarity — daylight accountability, efficient and open. **Ghost Mode** (dark) is protection — immersive, focused, operationally different from a simple color scheme change. Both are expressions of the same Vigilant Earth identity: forest authority + technological precision.

Mode switching uses CSS custom properties only. All color values reference variables. Transitioning modes is a single root-level attribute change (`data-theme="ghost"`), not individual component updates.

---

## Color

### Civic Mode (light)

| Token | Hex | Role |
|---|---|---|
| `--page` | `#f4f5ef` | Page background — green-tinted off-white |
| `--panel` | `#eceee6` | Cards, panels |
| `--panel-elevated` | `#e4e6de` | Dropdowns, popovers |
| `--overlay` | `#ffffff` | Modals, dialogs |
| `--ink` | `#111814` | Primary text — near-black, green tint |
| `--muted` | `#525e58` | Secondary text — 5.4:1 on page bg |
| `--muted-subtle` | `#748078` | Captions, timestamps — 3:1+ decorative |
| `--border` | `rgba(17,24,20,0.08)` | Default separator |
| `--border-strong` | `rgba(17,24,20,0.18)` | Form fields, emphasized |
| `--accent` | `#1b4332` | Forest green — primary brand, primary actions |
| `--accent-hover` | `#163829` | Accent hover |
| `--accent-subtle` | `rgba(27,67,50,0.08)` | Accent tint backgrounds |
| `--accent-bright` | `#2ee6c8` | Tech teal — dark-bg only, decorative |
| `--teal-ink` | `#0d8c79` | Teal for text on light bg — 5.1:1 on page |
| `--secondary` | `#5a7d6a` | Secondary brand green |
| `--amber` | `#b45309` | Warning signal — 4.6:1 on page |
| `--amber-subtle` | `rgba(180,83,9,0.08)` | Warning tint |
| `--green` | `#166534` | Semantic success — distinct from brand green |
| `--green-subtle` | `rgba(22,101,52,0.08)` | Success tint |
| `--red` | `#991b1b` | Error, critical |
| `--red-subtle` | `rgba(153,27,27,0.08)` | Error tint |

**Contrast verification (Civic):**
- `--ink` on `--page`: ~14:1
- `--muted` on `--page`: ~5.4:1
- `--accent` (text) on `--page`: ~9.8:1
- `--teal-ink` on `--page`: ~5.1:1
- `--amber` on `--page`: ~4.6:1
- `--green` on `--page`: ~7.2:1
- `--red` on `--page`: ~8.1:1
- White text on `--accent` (#1b4332): ~10.5:1

### Ghost Mode (dark)

| Token | Hex | Role |
|---|---|---|
| `--page` | `#0c1628` | Page background — deep navy |
| `--panel` | `#111e35` | Cards, panels — visibly distinct from page |
| `--panel-elevated` | `#162240` | Dropdowns, popovers |
| `--overlay` | `#1c2a4a` | Modals, dialogs |
| `--ink` | `#e8e0d4` | Primary text — warm off-white, not pure white |
| `--muted` | `#8a9baa` | Secondary text — 6.8:1 on page bg |
| `--muted-subtle` | `#5c6e7a` | Captions, timestamps — 3.1:1 |
| `--border` | `rgba(232,228,220,0.06)` | Default separator |
| `--border-strong` | `rgba(232,228,220,0.16)` | Emphasized border |
| `--accent` | `#2ee6c8` | Teal — primary in Ghost Mode |
| `--accent-hover` | `#3df0d2` | Accent hover |
| `--accent-subtle` | `rgba(46,230,200,0.08)` | Accent tint |
| `--secondary` | `#e8ad55` | Warm amber — secondary in Ghost Mode |
| `--amber` | `#f59e0b` | Warning, Ghost Mode indicator |
| `--green` | `#34d399` | Semantic success |
| `--red` | `#f87171` | Error, critical |

**Contrast verification (Ghost):**
- `--ink` on `--page`: ~13.5:1
- `--muted` on `--page`: ~6.8:1
- `--accent` on `--page`: ~9.9:1
- `--secondary` on `--page`: ~5.2:1
- `--amber` on `--page`: ~6.3:1

### Status colors

| Status | Civic | Ghost | Usage |
|---|---|---|---|
| `--status-pending` | `#b45309` | `#f59e0b` | Awaiting review |
| `--status-active` | `#0d8c79` | `#2ee6c8` | In progress |
| `--status-resolved` | `#166534` | `#34d399` | Resolved |
| `--status-critical` | `#991b1b` | `#f87171` | Critical / urgent |

Status is never communicated by color alone. Always pair with icon or text label.

---

## Typography

### Font families

| Role | Stack |
|---|---|
| Heading / Display | `Montserrat`, `Archivo Black`, Arial, sans-serif |
| Body | `Inter`, `Helvetica Now`, `Helvetica Neue`, Arial, sans-serif |
| Data / Mono | `Space Mono`, `JetBrains Mono`, `Courier New`, monospace |

The heading stack carries authority. Mono carries precision — use it for IDs, timestamps, counts, scoreboard numbers. Body carries clarity.

### Type scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-display` | `clamp(2.5rem, 5vw, 4.5rem)` | 1.1 | 700 | Hero stats, major callouts |
| `--text-4xl` | `2.25rem / 36px` | 1.15 | 700 | Page titles |
| `--text-3xl` | `1.875rem / 30px` | 1.2 | 700 | Section headings |
| `--text-2xl` | `1.5rem / 24px` | 1.25 | 600 | Card headings, modal titles |
| `--text-xl` | `1.25rem / 20px` | 1.3 | 600 | Subsection headings |
| `--text-lg` | `1.125rem / 18px` | 1.4 | 400 | Lead body text |
| `--text-base` | `1rem / 16px` | 1.6 | 400 | Default body |
| `--text-sm` | `0.875rem / 14px` | 1.5 | 400 | Supporting detail, help text |
| `--text-xs` | `0.75rem / 12px` | 1.4 | 500 | Labels, badges, table headers |
| `--text-2xs` | `0.6875rem / 11px` | 1.3 | 500 | Mono captions, timestamps |

### Rules

- Heading weight: 600–700. Never 800+ outside hero display.
- Body weight: 400. Never 300 (too light on screens). 500 for emphasis only.
- Mono text: always `font-variant-numeric: tabular-nums` for counts and IDs.
- Line length: cap at 65–72ch for reading text.
- Letter-spacing: `-0.02em` on headings; `0` on body; `0.08em` on all-caps mono labels.
- No all-caps body copy. All-caps is for short mono labels (4 words max).

---

## Spacing

4px base unit.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Icon gaps, tight internal |
| `--space-2` | `8px` | Close-related element gaps |
| `--space-3` | `12px` | Standard internal padding |
| `--space-4` | `16px` | Default component padding |
| `--space-5` | `20px` | Generous component padding |
| `--space-6` | `24px` | Section internal padding |
| `--space-8` | `32px` | Between distinct components |
| `--space-10` | `40px` | Section gaps |
| `--space-12` | `48px` | Major section separators |
| `--space-16` | `64px` | Page section gaps |
| `--space-20` | `80px` | Large section breaks |

---

## Shape

Border radius:

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Badges, chips, status pills |
| `--radius-md` | `6px` | Buttons, inputs, small cards |
| `--radius-lg` | `10px` | Main cards, panels, step cards |
| `--radius-xl` | `14px` | Large modals, sheets |
| `--radius-2xl` | `20px` | PWA full-screen elements only |
| `--radius-full` | `9999px` | Pills, toggles |

Rounding personality: moderate — neither the aggressive rounding of consumer apps nor the hard edges of developer tools. The product is civic, not friendly and not brutal.

---

## Elevation

### Civic Mode (shadows carry elevation)

| Level | Shadow |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(17,24,20,0.04), 0 2px 6px rgba(17,24,20,0.05)` |
| `--shadow-md` | `0 4px 12px rgba(17,24,20,0.08), 0 2px 4px rgba(17,24,20,0.04)` |
| `--shadow-lg` | `0 12px 32px rgba(17,24,20,0.12), 0 4px 8px rgba(17,24,20,0.06)` |

### Ghost Mode (borders carry elevation, not shadows)

Ghost Mode shadow opacity is 2–3× higher than Civic Mode for equivalent visual weight. Borders and surface tints carry the elevation distinction:

| Level | Treatment |
|---|---|
| level-1 | `border: 1px solid rgba(232,228,220,0.08)` |
| level-2 | `border: 1px solid rgba(232,228,220,0.12)` + surface tint |
| level-3 | `border: 1px solid rgba(46,230,200,0.12)` + teal micro-glow |

---

## Components

### Card

Default card: `rounded-[10px] border border-[--border] bg-[--panel]`.

**ReportCard (signature variant)**: Carries a 3px status track positioned at the left edge as an absolutely positioned element (not a CSS border). The track communicates status at a glance — pending, active, resolved, critical — paired with a status badge for non-color accessibility.

Track colors: pending=`--status-pending`, active=`--status-active`, resolved=`--status-resolved`, critical=`--status-critical`.

### Button

Five variants: `primary`, `secondary`, `ghost`, `danger`, `brutal`.

- Primary: `bg-[--accent] text-white` — used for single primary action per screen
- Secondary: `bg-[--panel] text-[--ink] border border-[--border]`
- Ghost: `text-[--muted] hover:text-[--ink]` — tertiary actions
- Danger: `bg-[--red] text-white`
- Brutal: `bg-[--accent] text-white border-2 shadow-[3px_3px_0_var(--accent-bright)]` + translate on hover — landing page CTAs, high-impact moments only

### Sidebar

Active state: left accent bar via pseudo-element (`before: absolute, left-0, w-0.5, h-1/2, bg-[--accent]`) + `bg-[--accent]/8` background. Not a border — a positioned pseudo-element.

Ghost Mode toggle in sidebar: when active, the toggle shows teal ring + teal text. This is Ghost Mode context, always on dark background, so teal text passes contrast.

### Badge

Six variants tied to semantic system: `default`, `success`, `warning`, `error`, `info`, `loading`. Each pairs color with icon. Color is never the sole indicator.

### Input (`.theme-input`)

Light bg (`--page`), `--border` border, focus state: `border-color: --accent` + 2px ring using `color-mix(--accent, 12%, transparent)`.

### Ghost Mode Badge (`.ghost-mode-badge`)

System-wide signature when Ghost Mode is active. Monospace, 11px, teal text, subtle teal border. Placed in the nav or header. Communicates operational context without alarming.

```
GHOST · ACTIVE
```

---

## Transitions

| Token | Value | Usage |
|---|---|---|
| `--transition-fast` | `120ms ease-out` | Hover fills, focus rings, checkbox |
| `--transition-std` | `180ms ease-out` | Button active, tab switch, tooltip |
| `--transition-expressive` | `300ms cubic-bezier(0.16,1,0.3,1)` | Panel open, modal, mode switch |

Mode switch applies `300ms ease-in-out` to `background-color`, `color`, `border-color`, `box-shadow` on `:root`. Never transition `transform`, `opacity`, `layout properties` on the root — they interfere with animations.

---

## Custom Signatures

Three elements that make LikasLens visually unmistakable:

1. **ReportCard status track** — A 3px positioned element at the card's left edge whose color maps directly to report status. Immediate, functional, distinctive.

2. **Ghost Mode Badge** — A compact monospace indicator (`GHOST · ACTIVE`) in teal on dark background. Not an alert, not a decoration — an operational context marker.

3. **Mono data layer** — All counts, IDs, resolution times, and scores use Space Mono / JetBrains Mono with tabular numerals. In a world of sans-serif dashboards, the deliberate mono data layer reads as precision and accountability, not decoration.

---

## Anti-patterns Eliminated

| Removed | Replaced with |
|---|---|
| `.gradient-text` / `.gradient-text-forest` | Solid `--accent` or `--accent-bright` — color has meaning, not decoration |
| `.glass-card` / `.glass-card-light` | Standard `.panel` card with proper surface tokens |
| `backdrop-filter` on ghost panels | Solid surfaces with distinct background tokens |
| `rgba(26,29,26,0.5)` muted text (fails 4.5:1) | `#525e58` — verified 5.4:1 on page bg |
| Undifferentiated Ghost Mode surfaces | Three-level surface hierarchy: page → panel → elevated → overlay |
