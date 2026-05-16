import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import BlobScene, { type BlobActivity } from '../sections/BlobScene'
import Mist from '../sections/Mist'
import {
  TweaksPanel,
  TweaksToggle,
  TweakSection,
  TweakSelect,
  TweakSlider,
  TweakToggle,
  useTweaks,
} from '../components/TweaksPanel'

// ============================================================================
// Hero / Specimen scene — ported from portfolio.html + portfolio-app.jsx.
// "SYSTEM ONLINE" + name are shifted DOWN via .hero-left padding-top in CSS,
// per user request — they were sitting too close to the top before.
// ============================================================================

const PALETTES: Record<string, [string, string, string, string]> = {
  abyss:  ['#161e44', '#4d6dc4', '#a3b9ed', '#ffffff'],
  ember:  ['#2a120a', '#9a4a26', '#ffb480', '#fff0dc'],
  mint:   ['#0e2218', '#1c5d44', '#82eec0', '#e6fff5'],
  mono:   ['#15151a', '#3a3a44', '#c8c8d0', '#ffffff'],
  violet: ['#1a1030', '#4a2a78', '#c3a4ff', '#f4e8ff'],
}

const PALETTE_LABELS: Record<string, string> = {
  abyss:  'Abyss',
  ember:  'Ember',
  mint:   'Mint',
  mono:   'Mono',
  violet: 'Violet',
}

interface TweakState {
  paletteKey: string
  spinSpeed: number
  jiggleAmount: number
  avoidStrength: number
  shadow: boolean
  mistDensity: number
  mistSpeed: number
  showHud: boolean
  blobScale: number
}

const TWEAK_DEFAULTS: TweakState = {
  paletteKey: 'abyss',
  spinSpeed: 0.10,
  jiggleAmount: 0.55,
  avoidStrength: 0.45,
  shadow: true,
  mistDensity: 0.55,
  mistSpeed: 1.0,
  showHud: true,
  blobScale: 1.0,
}

export default function Home() {
  const navigate = useNavigate()
  const [t, setTweak] = useTweaks<TweakState>(TWEAK_DEFAULTS, 'uh.home.tweaks.v1')
  const palette = PALETTES[t.paletteKey] || PALETTES.abyss
  const accent = palette[2]

  const [tweaksOpen, setTweaksOpen] = useState(false)

  // ENTER navigation — glitch → fade → route change
  const [glitching, setGlitching] = useState(false)
  const [exiting, setExiting] = useState(false)
  const enterClick = () => {
    if (exiting || glitching) return
    setGlitching(true)
    setTimeout(() => setExiting(true), 320)
    setTimeout(() => navigate('/portfolio'), 780)
  }

  // Live blob activity for HUD
  const [act, setAct] = useState<BlobActivity>({
    hover: 0, avoid: 0, clickEnergy: 0, waveEnergy: 0, sinceClick: 1000,
  })

  // Smoothed values — keep React updates inexpensive
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 800)
    return () => clearInterval(id)
  }, [])

  // Clock
  const [clockTime, setClockTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setClockTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const timeStr = clockTime.toTimeString().slice(0, 8)

  // Derived readouts
  const respBoost = Math.max(0, 1 - act.sinceClick / 1.8) * 0.35 + act.waveEnergy * 0.25
  const respiration = (0.28 + respBoost + Math.sin(tick * 0.4) * 0.04).toFixed(2)

  const elasticity =
    act.clickEnergy > 0.45 ? 'STRESSED'
    : act.clickEnergy > 0.12 ? 'OSCILLATING'
    : act.waveEnergy > 0.10 ? 'RIPPLING'
    : act.hover > 0.40 ? 'RESPONSIVE'
    : act.avoid > 0.10 ? 'RECOILING'
    : 'NOMINAL'

  const awarenessRaw = Math.min(1,
    act.hover * 0.85 +
    Math.max(0, 1 - act.sinceClick / 1.2) * 0.4 +
    act.avoid * 0.35
  )
  const awarenessPct = Math.round(awarenessRaw * 100) + '%'

  let containmentLabel: string, subjectLabel: string, subjectColor: string
  if (act.clickEnergy > 0.30) {
    containmentLabel = 'PERTURBED'
    subjectLabel = 'ELASTIC RESPONSE // OSCILLATING'
    subjectColor = accent
  } else if (act.waveEnergy > 0.10 || act.sinceClick < 1.5) {
    containmentLabel = 'RIPPLING'
    subjectLabel = 'POST-IMPACT // SETTLING'
    subjectColor = accent
  } else if (act.hover > 0.45) {
    containmentLabel = 'ATTENTIVE'
    subjectLabel = 'AWARE // TRACKING CURSOR'
    subjectColor = accent
  } else if (act.avoid > 0.12) {
    containmentLabel = 'EVASIVE'
    subjectLabel = 'RETREATING // OBSERVING'
    subjectColor = '#a08a72'
  } else {
    containmentLabel = 'STABLE'
    subjectLabel = 'ALIVE // OBSERVING'
    subjectColor = '#9aa0b4'
  }

  return (
    <div
      className={`stage${glitching ? ' is-glitching' : ''}${exiting ? ' is-exiting' : ''}`}
    >
      {glitching && <div className="glitch-fx" aria-hidden />}

      {/* Top bar — brand on left, status + Tweaks button on right */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" style={{ background: accent }} />
          UH<span className="muted"> // OBS-LOG 04</span>
        </div>
        <div className="topbar-right">
          <span className="muted topbar-status">CONTAINMENT</span>
          <span
            className="topbar-status"
            style={{ color: subjectColor, transition: 'color .5s ease' }}
          >
            {containmentLabel}
          </span>
          <span className="muted dot topbar-time">·</span>
          <span className="mono-tiny muted topbar-time">{timeStr}</span>
          {/* Tweaks toggle — top-right corner, sits inside topbar so it
              never overlaps with status readouts. Visual language matches
              the OBS-LOG aesthetic (accent dot + monospace label). */}
          <TweaksToggle
            open={tweaksOpen}
            onClick={() => setTweaksOpen((v) => !v)}
            accent={accent}
            inline
          />
        </div>
      </header>

      {/* Left content */}
      <main className="hero-left">
        <div className="kicker">
          <span className="kicker-bar" style={{ background: accent }} />
          <span
            className="glitch-slice"
            data-text="SYSTEM ONLINE"
            style={{ color: accent }}
          >
            SYSTEM ONLINE
          </span>
        </div>

        <h1 className="display">
          <span className="glitch-slice" data-text="UDULA">UDULA</span>
          <br />
          <span
            className="glitch-slice"
            data-text="HARITH"
            style={{ color: accent }}
          >
            HARITH
          </span>
        </h1>

        <p className="role mono-tiny">
          FULL-STACK <span className="muted">/</span> AI ENGINEER{' '}
          <span className="muted">/</span> KELANIYA, LK
        </p>

        <p className="lede">
          Building systems that think — neural networks, RAG pipelines, agentic
          architectures. Watching the specimen breathe. So am&nbsp;I.
        </p>

        <div className="cta-row">
          <button
            className="enter-btn"
            onClick={enterClick}
            style={
              {
                borderColor: accent,
                ['--accent-c' as never]: accent,
              } as CSSProperties
            }
          >
            <span className="enter-label glitch-slice" data-text="ENTER">ENTER</span>
            <span className="enter-arrow" aria-hidden>→</span>
          </button>
          <span className="hint mono-tiny muted">[ARCHIVE // 01–06]</span>
        </div>

        <div className="meta-row">
          <span className="meta-cell">
            <span className="mono-tiny muted">DEEP&nbsp;LEARNING</span>
            <span className="mono-tiny">/ NLP / AGENTS</span>
          </span>
          <span className="meta-cell">
            <span className="mono-tiny muted">IEEE&nbsp;IES 2026</span>
            <span className="mono-tiny">SHORTLISTED</span>
          </span>
        </div>
      </main>

      {/* Right — interactive blob. Caption sits OUTSIDE .blob-wrap so it
          doesn't scale with the blob when the Size tweak changes. */}
      <section className="hero-right">
        <div
          className="blob-wrap"
          style={{ transform: `scale(${t.blobScale})` }}
        >
          <BlobScene
            palette={palette}
            spinSpeed={t.spinSpeed}
            jiggleAmount={t.jiggleAmount}
            avoidStrength={t.avoidStrength}
            shadow={t.shadow}
            onActivity={setAct}
          />
        </div>
        <div className="blob-caption">
          <span className="mono-tiny muted">SPECIMEN&nbsp;//</span>
          <span className="mono-tiny" style={{ color: accent }}>
            {PALETTE_LABELS[t.paletteKey].toUpperCase()}
          </span>
        </div>
      </section>

      {/* Mist */}
      <Mist density={t.mistDensity} speed={t.mistSpeed} accent={accent} />

      {/* HUD */}
      {t.showHud && (
        <footer className="hud">
          <div className="hud-left mono-tiny">
            <span className="muted">SUBJECT:</span>&nbsp;
            <span
              style={{ color: subjectColor, transition: 'color .5s ease' }}
            >
              {subjectLabel}
            </span>
          </div>
          <div className="hud-right mono-tiny">
            <span>RESPIRATION <span className="muted">{respiration}&nbsp;Hz</span></span>
            <span>ELASTICITY <span className="muted">{elasticity}</span></span>
            <span>AWARENESS <span className="muted">{awarenessPct}</span></span>
          </div>
        </footer>
      )}

      {/* Tweaks panel — slides in from right */}
      <TweaksPanel
        title="TWEAKS"
        open={tweaksOpen}
        onClose={() => setTweaksOpen(false)}
        accent={accent}
      >
        <TweakSection label="Specimen" />
        <TweakSelect
          label="Palette"
          value={t.paletteKey}
          options={Object.keys(PALETTES).map((k) => ({
            value: k,
            label: PALETTE_LABELS[k],
          }))}
          onChange={(v) => setTweak('paletteKey', v)}
        />
        <TweakSlider
          label="Spin"
          value={t.spinSpeed}
          min={0}
          max={0.6}
          step={0.01}
          onChange={(v) => setTweak('spinSpeed', v)}
        />
        <TweakSlider
          label="Jiggle"
          value={t.jiggleAmount}
          min={0}
          max={1.5}
          step={0.01}
          onChange={(v) => setTweak('jiggleAmount', v)}
        />
        <TweakSlider
          label="Avoid cursor"
          value={t.avoidStrength}
          min={0}
          max={1.2}
          step={0.01}
          onChange={(v) => setTweak('avoidStrength', v)}
        />
        <TweakSlider
          label="Size"
          value={t.blobScale}
          min={0.6}
          max={1.4}
          step={0.01}
          onChange={(v) => setTweak('blobScale', v)}
        />
        <TweakToggle
          label="Shadow"
          value={t.shadow}
          onChange={(v) => setTweak('shadow', v)}
        />

        <TweakSection label="Mist" />
        <TweakSlider
          label="Density"
          value={t.mistDensity}
          min={0}
          max={1.2}
          step={0.01}
          onChange={(v) => setTweak('mistDensity', v)}
        />
        <TweakSlider
          label="Drift speed"
          value={t.mistSpeed}
          min={0}
          max={3}
          step={0.01}
          onChange={(v) => setTweak('mistSpeed', v)}
        />

        <TweakSection label="HUD" />
        <TweakToggle
          label="Show readouts"
          value={t.showHud}
          onChange={(v) => setTweak('showHud', v)}
        />
      </TweaksPanel>
    </div>
  )
}
