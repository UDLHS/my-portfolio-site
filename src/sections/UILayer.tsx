import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import SpecimenScene from './SpecimenScene'
import CustomCursor from './CustomCursor'

export default function UILayer() {
  const navigate = useNavigate()
  const [awareness, setAwareness] = useState(0)
  const [jiggleAmount, setJiggleAmount] = useState(0)
  const [vitals, setVitals] = useState({ resp: '0.42 Hz', elast: 'NOMINAL', aware: '0%' })
  const [status, setStatus] = useState({ label: 'SUBJECT: DORMANT // OBSERVING', nav: 'CONTAINMENT: STABLE', color: '#606068' })
  const [enterHidden, setEnterHidden] = useState(false)

  useEffect(() => {
    document.body.style.cursor = 'none'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [])

  const handleAwarenessChange = useCallback((a: number, j: number) => {
    setAwareness(a)
    setJiggleAmount(j)
  }, [])

  const handleVitalsUpdate = useCallback((resp: string, elast: string, aware: string) => {
    setVitals({ resp, elast, aware })
  }, [])

  const handleStatusChange = useCallback((label: string, nav: string, color: string) => {
    setStatus({ label, nav, color })
  }, [])

  const enterSite = () => {
    setEnterHidden(true)
    setTimeout(() => {
      navigate('/portfolio')
    }, 800)
  }

  return (
    <>
      <SpecimenScene
        onAwarenessChange={handleAwarenessChange}
        onVitalsUpdate={handleVitalsUpdate}
        onStatusChange={handleStatusChange}
      />
      <CustomCursor awareness={awareness} jiggleAmount={jiggleAmount} />

      {/* Atmospheric mist overlay — light mist */}
      <div
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(160, 160, 180, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(245, 245, 248, 0.2) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(200, 200, 215, 0.08) 0%, transparent 50%)
          `,
          mixBlendMode: 'screen',
          animation: 'mistDrift1 20s ease-in-out infinite',
        }}
      />
      {/* Atmospheric mist overlay — dark mist */}
      <div
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 70% 70%, rgba(6, 6, 12, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 70% at 10% 30%, rgba(10, 10, 18, 0.08) 0%, transparent 55%)
          `,
          mixBlendMode: 'multiply',
          animation: 'mistDrift2 25s ease-in-out infinite 3s',
        }}
      />

      <div className="ui-layer">
        <div className="nav-top">
          <div className="nav-left">OBSERVATION LOG 04</div>
          <div className="nav-right" style={{ color: status.color }}>
            {status.nav}
          </div>
        </div>

        <div className="right-content">
          <h1>Udula Harith</h1>
          <p className="subtitle">FULL-STACK // AI ENGINEER</p>
          <p className="welcome">
            AI engineer specializing in deep learning, NLP, and agentic systems. 
            Building intelligent machines that learn, adapt, and reason — from 
            neural networks to LLM-powered applications.
          </p>
          <button
            className="enter-btn-right"
            onClick={enterSite}
            style={{
              opacity: enterHidden ? 0 : undefined,
              transition: enterHidden ? 'opacity 0.8s ease' : undefined,
              pointerEvents: enterHidden ? 'none' : 'auto',
            }}
          >
            ENTER
          </button>
        </div>

        <div className="status-bar" style={{ color: status.color }}>
          {status.label}
        </div>

        <div className="vitals">
          <span>
            RESPIRATION <span className="value">{vitals.resp}</span>
          </span>
          <span>
            ELASTICITY <span className="value">{vitals.elast}</span>
          </span>
          <span>
            AWARENESS <span className="value">{vitals.aware}</span>
          </span>
        </div>
      </div>
    </>
  )
}
