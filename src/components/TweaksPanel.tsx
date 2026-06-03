import { useRef, useState, type CSSProperties, type ReactNode } from 'react'

// TweaksPanel.tsx
// Self-contained, no host messaging. Slides in from the right edge as a
// vertical sidebar so it matches the system-online / observation-log
// aesthetic of the hero (HUD / topbar / nav rails).
//
// Open state is driven by parent via `open` + `onClose`. The TweaksToggle
// component renders the "TWEAKS" button in the top-right of the page.

// ── Color helpers — derive the panel's themed glass from the blob palette ───
function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  const s = c.length === 3 ? c.replace(/./g, (ch) => ch + ch) : c
  const n = parseInt(s.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
// Mix two hex colors by t (0..1) and return rgba.
function mixRgba(hexA: string, hexB: string, t: number, a: number): string {
  const [r1, g1, b1] = hexToRgb(hexA)
  const [r2, g2, b2] = hexToRgb(hexB)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// Build the full set of CSS custom properties for a given blob palette.
// palette = [base(dark), lit(mid), rim(accent), spec(light)].
function paletteTheme(palette: string[]): CSSProperties {
  const [base, lit, rim, spec] = palette
  return {
    // Deep tinted glass background — base color, pushed dark + mostly
    // opaque so the panel stays legibly dark even where it overlays the
    // LIGHT top of the hero gradient.
    ['--twk-bg' as never]: mixRgba(base, '#04050a', 0.5, 0.95),
    ['--twk-bg-solid' as never]: mixRgba(base, '#04050a', 0.5, 1),
    // Slightly lifted surfaces (fields, footer) — base mixed toward lit.
    ['--twk-surface' as never]: mixRgba(base, lit, 0.22, 0.6),
    ['--twk-surface-2' as never]: mixRgba(base, lit, 0.34, 0.85),
    // Light ink tinted toward the spec highlight so text reads warm/cool
    // with the palette rather than pure white.
    ['--twk-ink' as never]: mixRgba(spec, '#ffffff', 0.2, 0.97),
    ['--twk-ink-soft' as never]: rgba(spec, 0.66),
    ['--twk-ink-faint' as never]: rgba(spec, 0.42),
    // Accent (rim) drives dots, slider fill, toggle-on, focus, scrollbar.
    ['--twk-accent' as never]: rim,
    ['--twk-accent-soft' as never]: rgba(rim, 0.55),
    ['--twk-accent-faint' as never]: rgba(rim, 0.26),
    ['--twk-hair' as never]: rgba(rim, 0.18),
    ['--twk-glow' as never]: rgba(rim, 0.5),
  }
}

interface TweaksPanelProps {
  title?: string
  open: boolean
  onClose: () => void
  accent?: string
  /** Full blob palette [base, lit, rim, spec] — themes the whole panel.
   *  Falls back to a default abyss-like palette when omitted. */
  palette?: string[]
  children: ReactNode
}

export function TweaksPanel({
  title = 'TWEAKS',
  open,
  onClose,
  accent = '#a3b9ed',
  palette = ['#161e44', '#4d6dc4', '#a3b9ed', '#ffffff'],
  children,
}: TweaksPanelProps) {
  const theme = paletteTheme(palette)
  return (
    <>
      <style>{TWEAKS_STYLE}</style>

      {/* Backdrop — soft, click to dismiss */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 5, 10, 0.34)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .35s ease',
          zIndex: 2147483640,
          backdropFilter: 'blur(2px)',
        }}
      />

      <aside
        className="twk-panel"
        data-open={open ? '1' : '0'}
        aria-hidden={!open}
        style={theme}
      >
        <div className="twk-hd">
          <div className="twk-hd-l">
            <span
              className="twk-dot"
              style={{ background: accent, boxShadow: `0 0 14px ${accent}` }}
            />
            <b>{title}</b>
          </div>
          <button
            className="twk-x"
            aria-label="Close tweaks"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="twk-body">{children}</div>
        <div className="twk-foot">
          <span>OBS-LOG // CONFIG</span>
          <span className="twk-foot-dot" />
        </div>
      </aside>
    </>
  )
}

// ── Form controls ──────────────────────────────────────────────────────────

interface TweakSectionProps { label: string; children?: ReactNode }
export function TweakSection({ label, children }: TweakSectionProps) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  )
}

interface RowProps { label: string; value?: ReactNode; children: ReactNode; inline?: boolean }
function Row({ label, value, children, inline = false }: RowProps) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  )
}

interface SliderProps {
  label: string; value: number; min?: number; max?: number; step?: number; unit?: string
  onChange: (v: number) => void
}
export function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }: SliderProps) {
  return (
    <Row label={label} value={`${value}${unit}`}>
      <input
        type="range"
        className="twk-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Row>
  )
}

interface ToggleProps { label: string; value: boolean; onChange: (v: boolean) => void }
export function TweakToggle({ label, value, onChange }: ToggleProps) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button
        type="button"
        className="twk-toggle"
        data-on={value ? '1' : '0'}
        role="switch"
        aria-checked={!!value}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </div>
  )
}

interface SelectOpt { value: string; label: string }
interface SelectProps {
  label: string
  value: string
  options: SelectOpt[]
  onChange: (v: string) => void
}
export function TweakSelect({ label, value, options, onChange }: SelectProps) {
  return (
    <Row label={label}>
      <select
        className="twk-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Row>
  )
}

// ── Top-right floating toggle button ────────────────────────────────────────
// Lives in the page corner like a system control. Visual language matches
// the observation-log / status-bar look: small accent dot + monospace label.

interface ToggleButtonProps {
  open: boolean
  onClick: () => void
  accent?: string
  /** Full blob palette [base, lit, rim, spec] — themes the open-state. */
  palette?: string[]
  /** When true, render as a static (non-fixed) flex child so it can sit
   *  inside a parent layout like a topbar. When false (default), the
   *  button is position:fixed in the top-right corner. */
  inline?: boolean
  /** Top offset in px (ignored when inline). */
  top?: number
  /** Right offset in px (ignored when inline). */
  right?: number
}

export function TweaksToggle({
  open,
  onClick,
  accent = '#a3b9ed',
  palette = ['#161e44', '#4d6dc4', '#a3b9ed', '#ffffff'],
  inline = false,
  top = 24,
  right = 24,
}: ToggleButtonProps) {
  const positioning: CSSProperties = inline
    ? { position: 'relative', marginLeft: 4 }
    : { position: 'fixed', top, right }
  // Open-state background = deep palette tint so the button matches the
  // panel it opens; closed-state stays the neutral glass chip.
  const openBg = mixRgba(palette[0], '#05060a', 0.3, 0.92)
  const openInk = rgba(palette[3], 0.95)
  return (
    <>
      <style>{TOGGLE_STYLE}</style>
      <button
        type="button"
        onClick={onClick}
        className="twk-fab"
        data-open={open ? '1' : '0'}
        data-inline={inline ? '1' : '0'}
        aria-pressed={open}
        aria-label={open ? 'Close tweaks' : 'Open tweaks'}
        style={{
          ...positioning,
          ['--twk-accent' as never]: accent,
          ['--twk-open-bg' as never]: openBg,
          ['--twk-open-ink' as never]: openInk,
        }}
      >
        <span
          className="twk-fab-dot"
          style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
        />
        <span className="twk-fab-lbl">TWEAKS</span>
        <span className="twk-fab-bars" aria-hidden>
          <i /><i /><i />
        </span>
      </button>
    </>
  )
}

// ── Custom hook for tweak state with localStorage persistence ───────────────
// The original tweaks-panel.jsx persisted via host postMessage. In a normal
// deployed site the host doesn't exist, so we use localStorage instead.

export function useTweaks<T extends object>(
  defaults: T,
  storageKey = 'uh.tweaks.v1',
): [T, <K extends keyof T>(key: K, value: T[K]) => void, () => void] {
  const [values, setValues] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaults
      const saved = JSON.parse(raw) as Partial<T>
      return { ...defaults, ...saved }
    } catch {
      return defaults
    }
  })
  // Stash latest in a ref so reset() doesn't need to be re-bound.
  const defaultsRef = useRef(defaults)
  defaultsRef.current = defaults

  const setTweak = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const reset = () => {
    setValues(defaultsRef.current)
    try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
  }

  return [values, setTweak, reset]
}

// ── Styles ──────────────────────────────────────────────────────────────────

const TOGGLE_STYLE = `
  .twk-fab {
    z-index: 2147483645;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 38px;
    padding: 0 16px 0 14px;
    border: 1px solid rgba(12, 12, 20, 0.18);
    background: rgba(248, 249, 253, 0.72);
    color: #0c0c14;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 4px;
    text-transform: uppercase;
    cursor: pointer;
    -webkit-backdrop-filter: blur(16px) saturate(150%);
    backdrop-filter: blur(16px) saturate(150%);
    transition:
      letter-spacing .35s ease,
      border-color .35s ease,
      background .35s ease,
      color .35s ease,
      box-shadow .35s ease;
  }
  .twk-fab:hover {
    letter-spacing: 5px;
    border-color: var(--twk-accent, #a3b9ed);
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 8px 28px rgba(8, 10, 22, 0.16);
  }
  .twk-fab[data-open="1"] {
    background: var(--twk-open-bg, #0a0a12);
    color: var(--twk-open-ink, #f4f5fa);
    border-color: var(--twk-accent, #0a0a12);
    box-shadow: 0 8px 28px rgba(8, 10, 22, 0.22);
  }
  .twk-fab[data-open="1"]:hover {
    background: var(--twk-open-bg, #1a1a24);
    filter: brightness(1.15);
  }
  .twk-fab-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .twk-fab-bars {
    display: inline-flex;
    flex-direction: column;
    gap: 3px;
    margin-left: 4px;
  }
  .twk-fab-bars i {
    display: block;
    width: 14px;
    height: 1.5px;
    background: currentColor;
    transition: transform .35s ease, opacity .35s ease, width .35s ease;
  }
  .twk-fab-bars i:nth-child(2) { width: 10px; }
  .twk-fab-bars i:nth-child(3) { width: 12px; }
  .twk-fab[data-open="1"] .twk-fab-bars i:nth-child(1) {
    transform: translateY(4.5px) rotate(45deg);
    width: 14px;
  }
  .twk-fab[data-open="1"] .twk-fab-bars i:nth-child(2) {
    opacity: 0;
  }
  .twk-fab[data-open="1"] .twk-fab-bars i:nth-child(3) {
    transform: translateY(-4.5px) rotate(-45deg);
    width: 14px;
  }
  @media (max-width: 520px) {
    .twk-fab {
      height: 34px;
      padding: 0 12px 0 11px;
      font-size: 9px;
      letter-spacing: 3px;
      gap: 8px;
    }
    .twk-fab-lbl { display: none; }
  }
`

const TWEAKS_STYLE = `
  .twk-panel {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: 340px;
    max-width: 92vw;
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    /* Dark, blob-tinted glass — driven by --twk-* vars set per palette. */
    background: var(--twk-bg, rgba(16, 18, 38, 0.86));
    color: var(--twk-ink, rgba(255, 255, 255, 0.96));
    -webkit-backdrop-filter: blur(30px) saturate(150%);
    backdrop-filter: blur(30px) saturate(150%);
    border-left: 1px solid var(--twk-accent-faint, rgba(163, 185, 237, 0.22));
    box-shadow:
      -28px 0 70px rgba(2, 3, 8, 0.5),
      -1px 0 0 var(--twk-accent-faint, rgba(163, 185, 237, 0.22)) inset;
    font: 11.5px/1.4 'JetBrains Mono', ui-monospace, monospace;
    transform: translateX(100%);
    opacity: 0;
    transition: transform .42s cubic-bezier(.2, .7, .2, 1), opacity .42s ease,
      background .5s ease, border-color .5s ease, box-shadow .5s ease, color .5s ease;
    will-change: transform, opacity;
  }
  .twk-panel[data-open="1"] {
    transform: translateX(0);
    opacity: 1;
  }
  /* Accent hairline running down the inner edge — reads as a "rail". */
  .twk-panel::before {
    content: "";
    position: absolute;
    top: 0; bottom: 0; left: 0;
    width: 2px;
    background: linear-gradient(180deg,
      transparent 0%,
      var(--twk-accent, #a3b9ed) 18%,
      var(--twk-accent, #a3b9ed) 82%,
      transparent 100%);
    opacity: 0.55;
    pointer-events: none;
  }
  .twk-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 16px 18px 22px;
    border-bottom: 1px solid var(--twk-hair, rgba(163, 185, 237, 0.16));
  }
  .twk-hd-l {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }
  .twk-hd b {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--twk-ink, #fff);
  }
  .twk-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    display: inline-block;
  }
  .twk-x {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--twk-ink-soft, rgba(255, 255, 255, 0.6));
    width: 28px;
    height: 28px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    transition: background .2s ease, color .2s ease;
  }
  .twk-x:hover {
    background: var(--twk-accent-faint, rgba(163, 185, 237, 0.2));
    color: var(--twk-ink, #fff);
  }
  .twk-body {
    flex: 1;
    padding: 16px 22px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: var(--twk-accent-soft, rgba(163, 185, 237, 0.5)) transparent;
  }
  .twk-body::-webkit-scrollbar { width: 8px; }
  .twk-body::-webkit-scrollbar-track { background: transparent; margin: 4px; }
  .twk-body::-webkit-scrollbar-thumb {
    background: var(--twk-accent-soft, rgba(163, 185, 237, 0.5));
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  .twk-body::-webkit-scrollbar-thumb:hover {
    background: var(--twk-accent, #a3b9ed);
    border: 2px solid transparent;
    background-clip: content-box;
  }
  .twk-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 22px 16px;
    border-top: 1px solid var(--twk-hair, rgba(163, 185, 237, 0.16));
    font-size: 9px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--twk-ink-faint, rgba(255, 255, 255, 0.4));
  }
  .twk-foot-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--twk-accent, #a3b9ed);
    box-shadow: 0 0 8px var(--twk-accent, #a3b9ed);
    animation: twkPulse 2.2s ease-in-out infinite;
  }
  @keyframes twkPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.4; transform: scale(0.85); }
  }
  .twk-row {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .twk-row-h {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .twk-lbl {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: var(--twk-ink-soft, rgba(255, 255, 255, 0.72));
    font-size: 10px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }
  .twk-lbl > span:first-child { font-weight: 500; }
  .twk-val {
    color: var(--twk-accent, #a3b9ed);
    font-variant-numeric: tabular-nums;
    letter-spacing: 1.5px;
  }
  .twk-sect {
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--twk-accent-soft, rgba(163, 185, 237, 0.5));
    padding: 8px 0 2px;
    border-top: 1px dashed var(--twk-hair, rgba(163, 185, 237, 0.16));
  }
  .twk-sect:first-child {
    padding-top: 0;
    border-top: 0;
  }
  .twk-field {
    appearance: none;
    box-sizing: border-box;
    width: 100%;
    height: 30px;
    padding: 0 28px 0 10px;
    border: 1px solid var(--twk-accent-faint, rgba(163, 185, 237, 0.22));
    border-radius: 0;
    background: var(--twk-surface, rgba(40, 48, 90, 0.55));
    color: var(--twk-ink, #fff);
    font: inherit;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    outline: none;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%23ffffff' fill-opacity='0.6' d='M0 0h10L5 6z'/></svg>");
    background-repeat: no-repeat;
    background-position: right 10px center;
    transition: border-color .2s ease, background-color .2s ease;
  }
  .twk-field:focus {
    border-color: var(--twk-accent, #a3b9ed);
    background-color: var(--twk-surface-2, rgba(40, 48, 90, 0.8));
  }
  .twk-field option {
    background: var(--twk-bg-solid, #10122a);
    color: var(--twk-ink, #fff);
  }
  .twk-slider {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 2px;
    margin: 8px 0 4px;
    background: var(--twk-accent-faint, rgba(163, 185, 237, 0.22));
    outline: none;
    border-radius: 999px;
  }
  .twk-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px; height: 14px;
    background: var(--twk-accent, #a3b9ed);
    border: 1px solid var(--twk-accent, #a3b9ed);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px var(--twk-glow, rgba(163, 185, 237, 0.45));
    transition: transform .15s ease;
  }
  .twk-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
  .twk-slider::-moz-range-thumb {
    width: 14px; height: 14px;
    background: var(--twk-accent, #a3b9ed);
    border: 1px solid var(--twk-accent, #a3b9ed);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px var(--twk-glow, rgba(163, 185, 237, 0.45));
  }
  .twk-toggle {
    position: relative;
    width: 34px;
    height: 18px;
    border: 1px solid var(--twk-accent-faint, rgba(163, 185, 237, 0.3));
    border-radius: 999px;
    background: var(--twk-surface, rgba(40, 48, 90, 0.5));
    cursor: pointer;
    padding: 0;
    transition: background .2s ease, border-color .2s ease, box-shadow .2s ease;
  }
  .twk-toggle[data-on="1"] {
    background: var(--twk-accent, #a3b9ed);
    border-color: var(--twk-accent, #a3b9ed);
    box-shadow: 0 0 12px var(--twk-glow, rgba(163, 185, 237, 0.45));
  }
  .twk-toggle i {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--twk-bg-solid, #10122a);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    transition: transform .2s ease, background .2s ease;
  }
  .twk-toggle[data-on="1"] i {
    transform: translateX(16px);
    background: #fff;
  }
`
