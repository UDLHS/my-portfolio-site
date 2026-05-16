import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import BackgroundBlob from '../sections/BackgroundBlob'

// Portfolio.tsx — Work archive page.
// Ported from work-app.jsx, kept faithful to the original Tailwind styling.

const projects = [
  {
    title: 'DEGREE GUIDANCE AI',
    category: 'RAG + AGENTIC AI',
    year: '2025',
    description:
      "Full-stack RAG + Agentic AI platform solving Sri Lanka's degree program selection crisis. Vector database retrieval, LLM generation, and multi-step reasoning to match students with optimal degree pathways.",
    stack: 'PYTHON · REACT · VECTOR DB',
    id: '01',
    github: 'https://github.com/UDLHS/AI-powered-Degree-guidance-Platform',
  },
  {
    title: 'FACE RECOGNITION',
    category: 'DEEP LEARNING',
    year: '2024',
    description:
      'Reproduction of the foundational Bromley et al. (1993) Siamese Neural Network paper for face verification. Contrastive learning, twin-network embeddings, and modern TensorFlow implementation from first principles.',
    stack: 'TENSORFLOW · CONTRASTIVE LOSS',
    id: '02',
    github: 'https://github.com/UDLHS/Face-Recognision-Model',
  },
  {
    title: 'NEXT WORD PREDICTION',
    category: 'NLP · LSTM',
    year: '2024',
    description:
      'LSTM-based language model predicting next word in text sequences. End-to-end NLP pipeline with tokenization, vocabulary mapping, and probability distribution over full vocabulary for auto-completion.',
    stack: 'TENSORFLOW · LSTM · NLP',
    id: '03',
    github: 'https://github.com/UDLHS/nextWordPred-LSTM',
  },
  {
    title: 'NUMBER RECOGNITION',
    category: 'COMPUTER VISION',
    year: '2024',
    description:
      'Neural network trained on MNIST dataset using PyTorch. Handwritten digit classification from first principles — data loading, model architecture, training loop, and evaluation.',
    stack: 'PYTORCH · MNIST · NN',
    id: '04',
    github: 'https://github.com/UDLHS/number-recog',
  },
  {
    title: 'SENTIMENT ANALYSIS',
    category: 'NLP · CLASSIFICATION',
    year: '2024',
    description:
      'Text sentiment classification system analyzing emotional tone in input data. Feature extraction, model training, and inference pipeline for positive/negative/neutral prediction.',
    stack: 'PYTHON · NLP · ML',
    id: '05',
    github: 'https://github.com/UDLHS/sentiment_analisis_project',
  },
  {
    title: 'CAR NEURAL NET',
    category: 'REINFORCEMENT LEARNING',
    year: '2024',
    description:
      'Self-learning car using neural networks in JavaScript. Autonomous agent trained to navigate environments through reinforcement learning and sensor-based decision making.',
    stack: 'JAVASCRIPT · NEURAL NETWORK',
    id: '06',
    github: 'https://github.com/UDLHS/js-car-ai',
  },
]

const capabilities = [
  'TENSORFLOW', 'PYTORCH', 'RAG PIPELINES', 'AGENTIC AI', 'PYTHON', 'JAVA', 'RUST',
  'SPRING BOOT', 'REST APIS', 'MERN STACK', 'KUBERNETES', 'AWS', 'DOCKER',
  'POSTGRESQL', 'MONGODB',
]

const achievements = [
  {
    title: 'IEEE IES GENAI CHALLENGE 2026',
    detail: 'Shortlisted — only Sri Lankan team from 575 submissions across 57 countries',
  },
  {
    title: 'IRAI 2026 RESEARCH PAPER',
    detail:
      '"OS-Level Contextual AI Assistant for Reducing Context Switching in Novice Programming Workflows" — under review',
  },
]

export default function Portfolio() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('hero')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const [glitching, setGlitching] = useState(false)
  const [exiting, setExiting] = useState(false)
  const goHome = () => {
    if (exiting || glitching) return
    setGlitching(true)
    setTimeout(() => setExiting(true), 320)
    setTimeout(() => navigate('/'), 780)
  }

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { threshold: 0.3 }
    )
    const sections = document.querySelectorAll('[data-section]')
    sections.forEach((s) => observerRef.current?.observe(s))
    return () => observerRef.current?.disconnect()
  }, [])

  // Lock body horizontal scroll
  useEffect(() => {
    document.body.style.overflowX = 'hidden'
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)

  const scrollTo = (id: string) => {
    closeMenu()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* BackgroundBlob sits OUTSIDE the page-in wrapper. Its <div> uses
          position:fixed, and a transformed ancestor would trap it (a
          non-none transform creates a containing block, which downgrades
          fixed to absolute and makes the blob scroll with the page).
          Mounting it as a sibling here keeps it truly viewport-fixed
          even while the wrapper runs its enter / glitch / exit transforms. */}
      <BackgroundBlob />
      <div
        className={`page-in relative min-h-screen w-full overflow-x-hidden${glitching ? ' is-glitching' : ''}${exiting ? ' is-exiting' : ''}`}
      >
        {glitching && <div className="glitch-fx" aria-hidden />}
        {!glitching && <div className="entry-glitch" aria-hidden />}

      {/* ========== NAVIGATION ========== */}
      <nav
        className="fixed top-0 left-0 w-full z-40 px-6 lg:px-16 py-4 lg:py-5 flex justify-between items-center"
        style={{
          background: 'rgba(245, 245, 248, 0.6)',
          backdropFilter: 'blur(20px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
          borderBottom: '1px solid rgba(45, 212, 168, 0.1)',
        }}
      >
        <button
          onClick={() => { closeMenu(); goHome() }}
          className="font-orbitron text-xs tracking-widest uppercase transition-all duration-500 hover:tracking-[6px]"
          style={{ color: '#2a8a6e', letterSpacing: '4px' }}
        >
          <span className="glitch-slice" data-text="UH">UH</span>
        </button>

        <div className="hidden md:flex gap-8 lg:gap-12">
          {[
            { label: 'WORK', id: 'work' },
            { label: 'ABOUT', id: 'about' },
            { label: 'CONTACT', id: 'contact' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="relative font-mono text-xs uppercase transition-all duration-500"
              style={{
                color: activeSection === item.id ? '#2a8a6e' : '#4a4a58',
                letterSpacing: '4px',
              }}
            >
              {item.label}
              <span
                className="absolute -bottom-1 left-0 h-px transition-all duration-500"
                style={{
                  width: activeSection === item.id ? '100%' : '0%',
                  background: '#2a8a6e',
                }}
              />
            </button>
          ))}
        </div>

        <button
          className="md:hidden flex flex-col gap-[5px] p-2"
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <span className="block w-5 h-[1.5px] transition-all duration-300"
            style={{ background: menuOpen ? '#2a8a6e' : '#4a4a58',
                     transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
          <span className="block w-5 h-[1.5px] transition-all duration-300"
            style={{ background: menuOpen ? '#2a8a6e' : '#4a4a58', opacity: menuOpen ? 0 : 1 }} />
          <span className="block w-5 h-[1.5px] transition-all duration-300"
            style={{ background: menuOpen ? '#2a8a6e' : '#4a4a58',
                     transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className="fixed inset-0 z-30 md:hidden transition-all duration-500"
        style={{
          background: 'rgba(245, 245, 248, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {[
            { label: 'WORK', id: 'work' },
            { label: 'ABOUT', id: 'about' },
            { label: 'CONTACT', id: 'contact' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="font-orbitron text-xl uppercase transition-colors duration-300"
              style={{
                color: activeSection === item.id ? '#2a8a6e' : '#1a1a24',
                letterSpacing: '6px',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========== HERO SECTION ========== */}
      <section
        id="hero"
        data-section
        className="relative min-h-screen flex flex-col justify-center items-start px-6 lg:px-16 pt-28 lg:pt-36 pb-12"
      >
        <div className="max-w-4xl relative z-10 w-full">
          <div className="font-mono text-xs uppercase mb-8 flex items-center gap-4"
            style={{ color: '#2a8a6e', letterSpacing: '6px' }}>
            <span className="inline-block w-8 h-px" style={{ background: '#2a8a6e' }} />
            SYSTEM ONLINE
          </div>

          <h1 className="font-orbitron uppercase font-black leading-none mb-6"
            style={{ fontSize: 'clamp(40px, 9.5vw, 120px)', color: '#1a1a24', letterSpacing: '4px' }}>
            <span className="glitch-slice" data-text="UDULA">UDULA</span><br />
            <span className="glitch-slice" data-text="HARITH" style={{ color: '#2a8a6e' }}>HARITH</span>
          </h1>

          <p className="font-rajdhani text-base sm:text-lg lg:text-xl font-light max-w-lg mb-10"
            style={{ color: '#2a2a38', lineHeight: 1.7 }}>
            AI engineer building systems that think. From neural networks and LLM
            architectures to production-grade intelligent applications — specializing
            in deep learning, NLP, and agentic AI systems.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <button
              onClick={() => scrollTo('work')}
              className="font-mono text-xs uppercase px-8 py-4 transition-all duration-500"
              style={{
                color: '#f5f5f8',
                background: '#1a1a24',
                letterSpacing: '4px',
                border: '1px solid #1a1a24',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#1a1a24'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a24'
                e.currentTarget.style.color = '#f5f5f8'
              }}
            >
              INITIATE
            </button>
            <span className="font-mono text-xs uppercase"
              style={{ color: '#2a2a38', letterSpacing: '3px' }}>
              SCROLL TO EXPLORE
            </span>
          </div>
        </div>

        {/* Decorative rings — hidden on small to avoid clutter */}
        <div className="absolute z-0 pointer-events-none hidden md:block"
          style={{ width: '350px', height: '350px', borderRadius: '50%',
                   border: '1px solid rgba(45, 212, 168, 0.12)',
                   top: '20%', right: '12%', animation: 'breathe 8s ease-in-out infinite' }} />
        <div className="absolute z-0 pointer-events-none hidden md:block"
          style={{ width: '280px', height: '280px', borderRadius: '50%',
                   border: '1px solid rgba(45, 212, 168, 0.08)',
                   top: '25%', right: '15%', animation: 'breathe 8s ease-in-out infinite 1s' }} />

        <div className="absolute bottom-0 left-0 w-full h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(45, 212, 168, 0.2) 50%, transparent 100%)' }} />
      </section>

      {/* ========== WORK SECTION ========== */}
      <section id="work" data-section
        className="relative w-full px-6 lg:px-16 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 lg:mb-20 gap-4">
            <div>
              <div className="font-mono text-xs uppercase mb-4"
                style={{ color: '#2a8a6e', letterSpacing: '5px' }}>
                ARCHIVE // 001
              </div>
              <h2 className="font-orbitron uppercase font-bold"
                style={{ fontSize: 'clamp(24px, 4vw, 48px)', color: '#1a1a24', letterSpacing: '6px' }}>
                <span className="glitch-slice" data-text="SELECTED WORK">SELECTED WORK</span>
              </h2>
            </div>
            <span className="font-mono text-xs block"
              style={{ color: '#2a2a38', letterSpacing: '4px' }}>
              06 ENTRIES
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {projects.map((project, i) => (
              <a key={i}
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-6 flex flex-col justify-between overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(45, 212, 168, 0.12)',
                  minHeight: '300px',
                  transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(45, 212, 168, 0.4)'
                  el.style.transform = 'translateY(-6px)'
                  el.style.background = 'rgba(255, 255, 255, 0.6)'
                  el.style.boxShadow = '0 20px 60px rgba(45, 212, 168, 0.1), 0 0 40px rgba(45, 212, 168, 0.05)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(45, 212, 168, 0.12)'
                  el.style.transform = 'translateY(0)'
                  el.style.background = 'rgba(255, 255, 255, 0.4)'
                  el.style.boxShadow = 'none'
                }}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-xs" style={{ color: '#2a8a6e', letterSpacing: '3px' }}>{project.id}</span>
                    <span className="font-mono text-xs" style={{ color: '#2a2a38', letterSpacing: '3px' }}>{project.year}</span>
                  </div>
                  <span className="font-mono text-xs block mb-2" style={{ color: '#2a2a38', letterSpacing: '3px' }}>{project.category}</span>
                  <h3 className="font-orbitron uppercase text-lg lg:text-xl mb-4 leading-tight"
                    style={{ color: '#1a1a24', letterSpacing: '2px' }}>
                    {project.title}
                  </h3>
                  <p className="font-rajdhani text-sm font-light leading-relaxed mb-4" style={{ color: '#2a2a38' }}>
                    {project.description}
                  </p>
                  <span className="font-mono text-xs" style={{ color: '#2a6a4e', letterSpacing: '2px' }}>{project.stack}</span>
                </div>
                <div className="relative z-10 flex justify-between items-center mt-8 pt-5"
                  style={{ borderTop: '1px solid rgba(45, 212, 168, 0.1)' }}>
                  <span className="font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ color: '#2a8a6e', letterSpacing: '2px' }}>
                    ACCESSING...
                  </span>
                  <span className="font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ color: '#1a1a24', letterSpacing: '3px' }}>
                    VIEW →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ABOUT SECTION ========== */}
      <section id="about" data-section
        className="relative w-full px-6 lg:px-16 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 relative z-10">
          <div className="lg:col-span-5">
            <div className="font-mono text-xs uppercase mb-4" style={{ color: '#2a8a6e', letterSpacing: '5px' }}>ARCHIVE // 002</div>
            <h2 className="font-orbitron uppercase font-bold mb-10"
              style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#1a1a24', letterSpacing: '6px' }}>
              <span className="glitch-slice" data-text="ENTITY DATA">ENTITY DATA</span>
            </h2>

            <div className="space-y-6 mb-10">
              <p className="font-rajdhani text-base lg:text-lg font-light leading-relaxed" style={{ color: '#1a1a24' }}>
                AI engineer and researcher at <strong>University of Kelaniya</strong>, pursuing
                BSc (Hons) Computer Science. Building <strong>intelligent systems</strong> that learn,
                adapt, and reason — from RAG pipelines and agentic architectures to
                neural networks deployed in production.
              </p>
              <p className="font-rajdhani text-base lg:text-lg font-light leading-relaxed" style={{ color: '#2a2a38' }}>
                My work lives at the intersection of research and implementation —
                reproducing foundational deep learning papers, architecting LLM-powered
                applications, and building the full-stack infrastructure to deploy them.
                From vector databases to reinforcement learning agents: if it thinks,
                I build it.
              </p>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-xs" style={{ color: '#2a8a6e', letterSpacing: '3px' }}>STATUS</span>
              <span className="font-mono text-xs" style={{ color: '#4a4a58', letterSpacing: '3px' }}>TRAINING // SEEKING DATA</span>
            </div>

            <div className="p-5 mb-8"
              style={{
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(45, 212, 168, 0.1)',
                borderLeft: '2px solid #2a8a6e',
              }}>
              <div className="font-mono text-xs uppercase mb-4"
                style={{ color: '#2a8a6e', letterSpacing: '4px' }}>
                ACHIEVEMENTS
              </div>
              {achievements.map((ach, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="font-orbitron text-xs uppercase" style={{ color: '#1a1a24', letterSpacing: '2px' }}>{ach.title}</div>
                  <div className="font-rajdhani text-sm font-light mt-1" style={{ color: '#2a2a38' }}>{ach.detail}</div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-4">
              <span className="font-mono text-xs mt-1" style={{ color: '#2a8a6e', letterSpacing: '2px' }}>EDU</span>
              <div>
                <div className="font-orbitron text-xs uppercase" style={{ color: '#1a1a24', letterSpacing: '2px' }}>UNIVERSITY OF KELANIYA</div>
                <div className="font-rajdhani text-sm font-light" style={{ color: '#2a2a38' }}>BSc (Hons) Computer Science · 2nd Year Undergraduate</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="font-mono text-xs uppercase mb-8" style={{ color: '#4a4a58', letterSpacing: '5px' }}>CAPABILITIES MATRIX</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {capabilities.map((skill, i) => (
                <div key={skill}
                  className="group flex items-center gap-3 p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(45, 212, 168, 0.1)',
                    transition: 'all 0.4s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(45, 212, 168, 0.4)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(45, 212, 168, 0.1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)' }}
                >
                  <span className="font-mono text-xs" style={{ color: '#2a8a6e', letterSpacing: '2px' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-orbitron text-xs uppercase" style={{ color: '#1a1a24', letterSpacing: '2px' }}>{skill}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 lg:p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(45, 212, 168, 0.12)',
                borderLeft: '2px solid #2a8a6e',
              }}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                  { label: 'REPOS', value: '25+' },
                  { label: 'YEARS', value: '02' },
                  { label: 'STACKS', value: '08' },
                  { label: 'CLIENTS', value: '03' },
                ].map((metric) => (
                  <div key={metric.label} className="text-center">
                    <div className="font-orbitron text-2xl lg:text-3xl font-bold mb-1" style={{ color: '#1a1a24' }}>{metric.value}</div>
                    <div className="font-mono text-xs" style={{ color: '#4a4a58', letterSpacing: '3px' }}>{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {['Python Programming', 'PyTorch Essentials', 'Cloud Computing'].map((cert) => (
                <span key={cert}
                  className="font-mono text-xs px-4 py-2"
                  style={{
                    color: '#2a2a38',
                    border: '1px solid rgba(45, 212, 168, 0.15)',
                    letterSpacing: '2px',
                    background: 'rgba(255,255,255,0.2)',
                  }}>
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONTACT SECTION ========== */}
      <section id="contact" data-section
        className="relative w-full px-6 lg:px-16 py-20 lg:py-32"
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="font-mono text-xs uppercase mb-6 flex justify-center items-center gap-4 flex-wrap"
            style={{ color: '#4a4a58', letterSpacing: '5px' }}>
            <span className="inline-block w-12 h-px" style={{ background: '#2a8a6e' }} />
            <span className="hidden sm:inline">OBSERVATION LOG CLOSED // INITIATE CONTACT</span>
            <span className="sm:hidden">INITIATE CONTACT</span>
            <span className="inline-block w-12 h-px" style={{ background: '#2a8a6e' }} />
          </div>

          <h2 className="font-orbitron uppercase font-black mb-8"
            style={{ fontSize: 'clamp(32px, 6vw, 72px)', color: '#1a1a24', letterSpacing: '4px' }}>
            <span className="glitch-slice" data-text="OPEN CHANNEL">OPEN CHANNEL</span>
          </h2>

          <div className="mb-14 mx-auto max-w-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(45, 212, 168, 0.2)',
              padding: '32px 40px',
            }}>
            <p className="font-rajdhani text-lg lg:text-xl font-light leading-relaxed"
              style={{ color: '#1a1a24', lineHeight: 1.8 }}>
              Open for collaborations, commissions, and experiments.
              <br />
              Based in Sri Lanka. Working worldwide.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
            <a href="mailto:udulaharith@gmail.com"
              className="font-mono text-xs uppercase px-10 py-5 transition-all duration-500"
              style={{
                color: '#f5f5f8',
                background: '#1a1a24',
                letterSpacing: '4px',
                border: '1px solid #1a1a24',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1a1a24'; e.currentTarget.style.boxShadow = '0 0 30px rgba(45, 212, 168, 0.15)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a24'; e.currentTarget.style.color = '#f5f5f8'; e.currentTarget.style.boxShadow = 'none' }}>
              TRANSMIT SIGNAL
            </a>
            <a href="https://github.com/UDLHS" target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs uppercase px-10 py-5 transition-all duration-500"
              style={{
                color: '#2a2a38',
                background: 'transparent',
                letterSpacing: '4px',
                border: '1px solid rgba(45, 212, 168, 0.2)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(45, 212, 168, 0.5)'; e.currentTarget.style.color = '#2a8a6e' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(45, 212, 168, 0.2)'; e.currentTarget.style.color = '#2a2a38' }}>
              GITHUB →
            </a>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8">
            <a href="https://www.linkedin.com/in/udula-harith-sadishan-703b41321" target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs uppercase transition-colors duration-300"
              style={{ color: '#4a4a58', letterSpacing: '3px' }}>
              LINKEDIN
            </a>
            <span className="hidden sm:inline" style={{ color: '#8a8a98' }}>·</span>
            <span className="font-mono text-xs" style={{ color: '#4a4a58', letterSpacing: '3px' }}>+94 76 623 4966</span>
            <span className="hidden sm:inline" style={{ color: '#8a8a98' }}>·</span>
            <span className="font-mono text-xs" style={{ color: '#4a4a58', letterSpacing: '3px' }}>SRI LANKA</span>
          </div>
        </div>
      </section>

      <footer
        className="w-full px-6 lg:px-16 py-8 lg:py-10 flex flex-col sm:flex-row justify-between items-center gap-3 relative z-10"
        style={{ borderTop: '1px solid rgba(45, 212, 168, 0.1)' }}>
        <span className="font-orbitron text-xs uppercase" style={{ color: '#4a4a58', letterSpacing: '4px' }}>
          UDULA HARITH // 2025
        </span>
        <span className="font-mono text-xs text-center sm:text-right" style={{ color: '#4a4a58', letterSpacing: '4px' }}>
          AI ENGINEER · DEEP LEARNING · AGENTIC SYSTEMS
        </span>
      </footer>
      </div>
    </>
  )
}
