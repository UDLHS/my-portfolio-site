// Mist — drifting fog layer for the bottom half of the hero stage.

interface MistProps {
  density: number
  speed: number
  accent: string
}

export default function Mist({ density, speed, accent }: MistProps) {
  const safeSpeed = Math.max(speed, 0.05)
  return (
    <div className="mist-stack" style={{ opacity: density }}>
      <div className="mist mist-1" style={{ animationDuration: `${30 / safeSpeed}s` }} />
      <div className="mist mist-2" style={{ animationDuration: `${45 / safeSpeed}s` }} />
      <div
        className="mist mist-3"
        style={{
          animationDuration: `${60 / safeSpeed}s`,
          background: `radial-gradient(ellipse 60% 50% at 40% 90%, ${hexA(accent, 0.10)} 0%, transparent 60%)`,
        }}
      />
      <div className="mist-floor" />
    </div>
  )
}

function hexA(hex: string, a: number): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
