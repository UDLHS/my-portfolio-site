# SPECIMEN // CONTAINMENT

> An alien intelligence portfolio — not a typical developer website.

**Live:** [https://n2ir2cabpls7i.kimi.page](https://n2ir2cabpls7i.kimi.page)

---

## The Idea

I'm an AI engineer. I wanted a portfolio that doesn't scream "template" or "corporate." I wanted something that feels like stepping into a lab where a digital organism is being observed — something alive, intelligent, and curious.

The core concept: **a sentient bioform that learns to trust you.**

Most portfolios are static. Mine is reactive. The creature on the landing page isn't decoration — it's a behavior system. It avoids you at first (like any wild intelligence would), but if you're patient and approach it a few times, it becomes curious. Hover long enough, and it fully engages — stretching toward your cursor, tracking you with an "eye," pulsing with neural waves.

This isn't a gimmick. It's a thesis: **I build systems that think.** The blob is a metaphor for every project in this portfolio.

---

## The Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Bundler** | Vite 7 |
| **Styling** | Tailwind CSS 3.4 |
| **3D Engine** | Three.js (r128) |
| **Routing** | React Router (HashRouter) |
| **UI Fonts** | Orbitron + Rajdhani + JetBrains Mono |
| **Landing Font** | Cormorant Garamond (replaced with Orbitron) |

---

## The Creature — 3-State Intelligence Machine

A custom Icosahedron sphere with a full vertex/fragment shader pipeline. Not a pre-built Three.js material — hand-written GLSL.

### Behavior States

```
┌─────────┐     3 approaches      ┌──────────┐    hover 0.3s     ┌──────────┐
│  AVOID  │ ─────────────────────→│ CURIOUS  │ ─────────────────→│ ENGAGED  │
│         │                       │          │                   │          │
│ retreats│                       │ watches  │                   │ stretches│
│ 0.1 awr │                       │ 0.25 awr │                   │ 0.9 awr  │
└─────────┘                       └──────────┘                   └──────────┘
     ↑                                                               │
     └────────────── leave 5s ───────────────────────────────────────┘
```

**AVOID** — The blob physically retreats from your cursor. Faster, nervous breathing. No neural waves.

**CURIOUS** — After 3 approach-leave cycles, it stops running. Sits still. Watches. Neural waves begin rippling across its surface.

**ENGAGED** — Full spring physics. Squash & stretch toward cursor. Awareness bulge (the "eye"). Click triggers jiggle + ripple. Fast swipes startle it.

### Shader Pipeline (7 Layers)

1. **Idle Wobble** — FBM noise keeps the sphere alive
2. **Neural Waves** — Up to 6 traveling Gaussian pulses across surface
3. **Awareness Bulge** — Primitive "eye" bulges toward focus point
4. **Click Pulse** — Sine ripple from click point with exponential decay
5. **Squash & Stretch** — Volume-preserving spring deformation
6. **Jiggle Oscillation** — Sine bounce with cross-mode harmonics
7. **Breathing** — Global sine scale (state-dependent rate)

### Fragment Shader — Bioluminescent Alien Bioform

- Deep blue-black base `vec3(0.025, 0.028, 0.045)`
- Two-light setup (cool key + warm fill)
- Iridescent specular: cyan-to-pink Fresnel shift
- Rim lighting: cool blue edge glow
- Neural wave sheen as pulses pass

---

## Portfolio Interior

After clicking **ENTER**, the misty gradient continues seamlessly into the portfolio:

- **Misty gradient background** — white at top cascading to dark pool at bottom
- **Floating organic blobs** — CSS drift animations, decorative
- **Glassmorphism cards** — frosted glass with cyan glow borders on hover
- **Orbitron typography** — sci-fi display font for headings
- **Rajdhani body text** — technical, readable, slightly exotic
- **Background Three.js blob** — passive jiggling creature, wanders slowly, no interaction

---

## Current Status

**Work in progress.** The core is solid — the 3-state intelligence machine, the shader pipeline, the portfolio layout. Still iterating on:

- [ ] More portfolio projects (currently 6 real projects)
- [ ] Refining the blob's visual fidelity
- [ ] Additional atmospheric effects
- [ ] Performance optimization for lower-end devices

---

## Run Locally

```bash
git clone <repo>
cd app
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

---

## About Me

**Udula Harith** — AI Engineer & Full-Stack Developer

- Undergraduate at University of Kelaniya, BSc (Hons) Computer Science
- IEEE IES GenAI Challenge 2026 — Shortlisted (only Sri Lankan team, 575 submissions, 57 countries)
- IRAI 2026 Research Paper — under review
- Deep Learning · NLP · Agentic AI · RAG Pipelines · Full-Stack Systems

[GitHub](https://github.com/UDLHS) · [LinkedIn](https://www.linkedin.com/in/udula-harith-sadishan-703b41321)

---

*The blob is learning. So am I.*
