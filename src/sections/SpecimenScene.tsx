import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface SpecimenSceneProps {
  onAwarenessChange?: (awareness: number, jiggleAmount: number) => void
  onVitalsUpdate?: (respiration: string, elasticity: string, awarenessPct: string) => void
  onStatusChange?: (label: string, nav: string, color: string) => void
}

export default function SpecimenScene({
  onAwarenessChange,
  onVitalsUpdate,
  onStatusChange,
}: SpecimenSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ============================================
    // SCENE
    // ============================================
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x060608, 0.025)

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.set(0, 0, 12)

    // ============================================
    // MOUSE
    // ============================================
    const mouse = { x: 0.5, y: 0.5 }
    const smoothMouse = { x: 0.5, y: 0.5 }
    const lastMouse = { x: 0.5, y: 0.5 }
    let mouseSpeed = 0
    let isMouseActive = false
    let lastMoveTime = 0
    let isHovering = false

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth
      mouse.y = 1.0 - e.clientY / window.innerHeight
      isMouseActive = true
      lastMoveTime = performance.now() / 1000
    }

    document.addEventListener('mousemove', handleMouseMove)

    // ============================================
    // RESPONSIVE BLOB POSITION
    // ============================================
    function getBlobBaseX(): number {
      const w = window.innerWidth
      if (w < 480) return 0      // phone: center
      if (w < 768) return 1.5    // tablet small: slightly right
      if (w < 1024) return 2.5   // tablet: more right
      return 4.2                 // desktop: far right
    }
    let BLOB_BASE_X = getBlobBaseX()

    // ============================================
    // CREATURE SPHERE
    // ============================================
    const MAX_PULSES = 6
    const SPHERE_RADIUS = 2.5

    const geo = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 64)

    const pulseUniforms: THREE.Vector4[] = []
    for (let i = 0; i < MAX_PULSES; i++)
      pulseUniforms.push(new THREE.Vector4(0, 1, 0, -1000))
    const pulseStrengths = new Array(MAX_PULSES).fill(0)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStretchAxis: { value: new THREE.Vector3(0, 1, 0) },
        uStretchAmount: { value: 0.0 },
        uJiggleAxis: { value: new THREE.Vector3(0, 1, 0) },
        uJiggleAmount: { value: 0.0 },
        uJiggleFreq: { value: 14.0 },
        uClickPulse: { value: 0.0 },
        uClickCenter: { value: new THREE.Vector3() },
        uFocus: { value: new THREE.Vector3(0, 0, 5) },
        uAwareness: { value: 0.0 },
        uPulses: { value: pulseUniforms },
        uPulseStrengths: { value: pulseStrengths },
        uBreathRate: { value: 0.4 },
        uBreathAmp: { value: 0.05 },
      },
      vertexShader: `
        #define MAX_PULSES 6
        uniform float uTime;
        uniform vec3  uStretchAxis;
        uniform float uStretchAmount;
        uniform vec3  uJiggleAxis;
        uniform float uJiggleAmount;
        uniform float uJiggleFreq;
        uniform float uClickPulse;
        uniform vec3  uClickCenter;
        uniform vec3  uFocus;
        uniform float uAwareness;
        uniform vec4  uPulses[MAX_PULSES];
        uniform float uPulseStrengths[MAX_PULSES];
        uniform float uBreathRate;
        uniform float uBreathAmp;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vGazeFacing;
        varying float vWaveEnergy;

        // ---- simplex noise ----
        vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float snoise(vec3 v){
            const vec2 C=vec2(1.0/6.0,1.0/3.0);
            const vec4 D=vec4(0.0,0.5,1.0,2.0);
            vec3 i=floor(v+dot(v,C.yyy));
            vec3 x0=v-i+dot(i,C.xxx);
            vec3 g=step(x0.yzx,x0.xyz);
            vec3 l=1.0-g;
            vec3 i1=min(g.xyz,l.zxy);
            vec3 i2=max(g.xyz,l.zxy);
            vec3 x1=x0-i1+C.xxx;
            vec3 x2=x0-i2+C.yyy;
            vec3 x3=x0-D.yyy;
            i=mod289(i);
            vec4 p=permute(permute(permute(
                i.z+vec4(0.0,i1.z,i2.z,1.0))
                +i.y+vec4(0.0,i1.y,i2.y,1.0))
                +i.x+vec4(0.0,i1.x,i2.x,1.0));
            float n_=0.142857142857;
            vec3 ns=n_*D.wyz-D.xzx;
            vec4 j=p-49.0*floor(p*ns.z*ns.z);
            vec4 x_=floor(j*ns.z);
            vec4 y_=floor(j-7.0*x_);
            vec4 x=x_*ns.x+ns.yyyy;
            vec4 y=y_*ns.x+ns.yyyy;
            vec4 h=1.0-abs(x)-abs(y);
            vec4 b0=vec4(x.xy,y.xy);
            vec4 b1=vec4(x.zw,y.zw);
            vec4 s0=floor(b0)*2.0+1.0;
            vec4 s1=floor(b1)*2.0+1.0;
            vec4 sh=-step(h,vec4(0.0));
            vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
            vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
            vec3 p0=vec3(a0.xy,h.x);
            vec3 p1=vec3(a0.zw,h.y);
            vec3 p2=vec3(a1.xy,h.z);
            vec3 p3=vec3(a1.zw,h.w);
            vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
            p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
            vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
            m=m*m;
            return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }
        float fbm(vec3 p){
            float v=0.0,a=0.5,f=1.0;
            for(int i=0;i<4;i++){ v+=a*snoise(p*f); a*=0.5; f*=2.1; }
            return v;
        }

        vec3 squashStretch(vec3 p, vec3 axis, float amt) {
            float along = dot(p, axis);
            vec3 perp = p - along * axis;
            return axis * along * (1.0 + amt) + perp * (1.0 - amt * 0.5);
        }

        void main() {
            vec3 pos = position;
            vec3 nrm = normalize(normal);
            vec3 originalNormal = nrm;

            // 1. IDLE WOBBLE
            float w1 = fbm(pos * 0.55 + uTime * 0.25);
            float w2 = fbm(pos * 1.1  + vec3(50.0) + uTime * 0.4);
            float idleWobble = w1 * 0.10 + w2 * 0.04;
            pos += nrm * idleWobble;

            // 2. TRAVELLING NEURAL WAVES
            float waveSum = 0.0;
            float waveEnergy = 0.0;
            for (int i = 0; i < MAX_PULSES; i++) {
                vec4 pulse = uPulses[i];
                float strength = uPulseStrengths[i];
                if (strength < 0.001) continue;
                vec3 pulseDir = normalize(pulse.xyz);
                float elapsed = uTime - pulse.w;
                if (elapsed < 0.0 || elapsed > 4.0) continue;
                float ang = acos(clamp(dot(originalNormal, pulseDir), -1.0, 1.0));
                float waveRadius = elapsed * 1.0;
                float band = exp(-pow((ang - waveRadius) * 4.5, 2.0));
                float decay = exp(-elapsed * 0.55);
                waveSum += band * decay * strength;
                waveEnergy += decay * strength;
            }
            pos += nrm * waveSum * 0.30;
            vWaveEnergy = waveEnergy;

            // 3. AWARENESS BULGE
            vec3 focusDir = normalize(uFocus);
            float facing = max(0.0, dot(originalNormal, focusDir));
            float gaze = pow(facing, 5.0) * uAwareness * 0.35;
            pos += originalNormal * gaze;
            vGazeFacing = facing;

            // 4. CLICK PULSE
            if (uClickPulse > 0.01) {
                vec3 toClick = pos - uClickCenter;
                float d = length(toClick);
                float wv = sin(d * 3.0 - uTime * 8.0) * 0.5 + 0.5;
                wv *= exp(-d * 0.7) * uClickPulse;
                pos += nrm * wv * 1.2;
            }

            // 5. SQUASH & STRETCH
            if (abs(uStretchAmount) > 0.001) {
                pos = squashStretch(pos, uStretchAxis, uStretchAmount);
            }

            // 6. JIGGLE OSCILLATION
            if (uJiggleAmount > 0.001) {
                float wave = sin(uTime * uJiggleFreq) * uJiggleAmount;
                pos = squashStretch(pos, uJiggleAxis, wave * 0.35);
                vec3 perpAxis = normalize(cross(uJiggleAxis, vec3(0.0, 0.0, 1.0)) + vec3(0.001));
                float wave2 = sin(uTime * uJiggleFreq * 0.62 + 1.3) * uJiggleAmount * 0.6;
                pos = squashStretch(pos, perpAxis, wave2 * 0.25);
            }

            // 7. BREATHING
            float breathe = sin(uTime * uBreathRate * 6.2831) * uBreathAmp;
            pos *= 1.0 + breathe;

            vPosition = pos;
            vNormal = normalize(nrm + vec3(w1*0.06, w2*0.06, 0.0));

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uAwareness;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vGazeFacing;
        varying float vWaveEnergy;

        void main() {
            vec3 keyDir  = normalize(vec3( 0.6,  0.8,  0.7));
            vec3 fillDir = normalize(vec3(-0.7, -0.3,  0.4));
            vec3 viewDir = normalize(-vPosition);
            vec3 halfKey = normalize(keyDir + viewDir);

            // Alien bioform — deep blue-black with bioluminescent properties
            vec3 baseColor = vec3(0.025, 0.028, 0.045);

            float diffKey  = max(dot(vNormal, keyDir),  0.0);
            float diffFill = max(dot(vNormal, fillDir), 0.0);

            // Glossy specular highlight
            float spec = pow(max(dot(vNormal, halfKey), 0.0), 70.0);
            float spec2 = pow(max(dot(vNormal, halfKey), 0.0), 18.0) * 0.25;

            // Edge / rim
            float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
            float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

            // Iridescent tint that shifts with view angle — cool blue-cyan to dusty pink
            vec3 iridA = vec3(0.55, 0.70, 0.95); // cool blue-cyan
            vec3 iridB = vec3(0.85, 0.65, 0.75); // dusty pink
            vec3 specTint = mix(vec3(0.85), mix(iridA, iridB, sin(fresnel * 6.28) * 0.5 + 0.5), 0.6);

            vec3 color = baseColor;
            color += vec3(0.25, 0.28, 0.40) * diffKey;       // cool key contribution
            color += vec3(0.18, 0.10, 0.14) * diffFill;      // warm fill contribution
            color += specTint * spec * 1.4;                  // sharp gloss
            color += vec3(0.30, 0.32, 0.45) * spec2;         // broad gloss
            color += vec3(0.30, 0.35, 0.55) * rim * 0.35;    // edge rim
            color += vec3(0.15, 0.18, 0.30) * fresnel * 0.5; // grazing tint

            // Travelling waves leave a faint sheen as they pass
            color += vec3(0.10, 0.13, 0.18) * vWaveEnergy * 0.7;

            // Tiny extra highlight where the gaze focuses (lensy)
            float gazeHi = pow(vGazeFacing, 16.0) * uAwareness * 0.12;
            color += vec3(0.7, 0.78, 1.0) * gazeHi;

            gl_FragColor = vec4(color, 1.0);
        }
      `,
    })

    const blob = new THREE.Mesh(geo, mat)
    blob.position.x = BLOB_BASE_X
    scene.add(blob)

    // Soft ground glow / shadow plate (under blob)
    const glowGeo = new THREE.PlaneGeometry(20, 20)
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
            float d = distance(vUv, vec2(0.5));
            float alpha = smoothstep(0.45, 0.0, d) * 0.18;
            gl_FragColor = vec4(0.05, 0.06, 0.10, alpha);
        }
      `,
    })
    const glowDisc = new THREE.Mesh(glowGeo, glowMat)
    glowDisc.position.set(BLOB_BASE_X, 0, -2)
    scene.add(glowDisc)

    // ============================================
    // REFLECTION / MIRROR FLOOR
    // ============================================
    // Sharp glossy floor with blob reflection
    const floorGeo = new THREE.PlaneGeometry(40, 40)
    const floorMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uBlobPos: { value: new THREE.Vector3(BLOB_BASE_X, 0, 0) },
        uBlobRadius: { value: SPHERE_RADIUS },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uBlobPos;
        uniform float uBlobRadius;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          // Sharp floor — subtle gradient from center
          vec2 center = vec2(0.5);
          float d = distance(vUv, center);

          // Floor base — cool dark grey with slight shine
          vec3 floorColor = vec3(0.03, 0.03, 0.05);

          // Glossy reflection area under blob
          vec3 toBlob = vWorldPos - uBlobPos;
          float distToBlob = length(toBlob.xz);

          // Sharp reflection falloff — tight around blob
          float reflectionRadius = uBlobRadius * 1.6;
          float reflection = smoothstep(reflectionRadius, 0.0, distToBlob);

          // Blurred reflection color — dark blue-teal
          vec3 reflectionColor = vec3(0.06, 0.08, 0.16);

          // Specular highlight on floor (sharp, wet look)
          vec3 viewDir = normalize(vec3(0.0, 5.0, 10.0) - vWorldPos);
          vec3 halfDir = normalize(normalize(vec3(0.0, 1.0, 0.0)) + viewDir);
          float floorSpec = pow(max(dot(normalize(vec3(0.0, 1.0, 0.0)), halfDir), 0.0), 120.0);

          // Combine
          vec3 color = floorColor;
          color += reflectionColor * reflection * 0.5;
          color += vec3(0.15, 0.18, 0.30) * floorSpec * reflection * 0.8;

          // Sharp floor edge line
          float edge = smoothstep(0.48, 0.5, abs(vUv.x - 0.5)) + smoothstep(0.48, 0.5, abs(vUv.y - 0.5));
          color += vec3(0.08, 0.10, 0.18) * edge * 0.3;

          // Fade alpha based on distance from blob
          float alpha = reflection * 0.55 + 0.02;
          alpha *= smoothstep(15.0, 5.0, distToBlob);

          gl_FragColor = vec4(color, alpha);
        }
      `,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -3.5
    scene.add(floor)

    // ============================================
    // JELLY PHYSICS
    // ============================================
    const STRETCH_STIFFNESS = 70
    const STRETCH_DAMPING = 8
    const stretchVec = new THREE.Vector3()
    const stretchVel = new THREE.Vector3()
    const stretchTarget = new THREE.Vector3()

    let jiggleAmount = 0
    const jiggleAxis = new THREE.Vector3(0, 1, 0)

    let clickPulse = 0
    const clickCenter = new THREE.Vector3()

    const focus = new THREE.Vector3(0, 0, 5)
    const focusTarget = new THREE.Vector3(0, 0, 5)
    let awareness = 0
    let nextSaccadeAt = 3
    let saccadeUntil = 0

    let breathRate = 0.32
    let breathAmp = 0.05
    let nextBreathShiftAt = 4

    let nextPulseAt = 1.5
    let nextPulseSlot = 0

    function emitPulseDir(dir: THREE.Vector3, strength: number, atTime: number) {
      const slot = nextPulseSlot
      pulseUniforms[slot].set(dir.x, dir.y, dir.z, atTime)
      pulseStrengths[slot] = strength
      nextPulseSlot = (nextPulseSlot + 1) % MAX_PULSES
    }

    function emitPulseAtPoint(worldPoint: THREE.Vector3, strength: number, atTime: number) {
      const dir = worldPoint.clone().normalize()
      if (!isFinite(dir.x)) return
      emitPulseDir(dir, strength, atTime)
    }

    const handleClick = (_e: MouseEvent) => {
      const cx = (mouse.x - 0.5) * 12
      const cy = (mouse.y - 0.5) * 8
      clickCenter.set(cx, cy, 0)
      clickPulse = 1.0

      const axis = clickCenter.clone()
      if (axis.lengthSq() > 0.0001) {
        jiggleAxis.copy(axis).normalize()
      } else {
        jiggleAxis.set(0, 1, 0)
      }
      jiggleAmount = Math.min(1.0, jiggleAmount + 0.55)

      stretchVel.add(jiggleAxis.clone().multiplyScalar(8))
      emitPulseAtPoint(clickCenter, 0.9, performance.now() / 1000)
    }

    document.addEventListener('click', handleClick)

    // ============================================
    // INTELLIGENT BEHAVIOR STATE MACHINE
    // ============================================
    type CreatureState = 'avoid' | 'curious' | 'engaged'
    let creatureState: CreatureState = 'avoid'
    let approachCount = 0
    let wasInApproachZone = false
    let curiousHoverTime = 0
    let lastCreatureState: CreatureState = 'avoid'

    const avoidOffset = new THREE.Vector3(0, 0, 0)
    const avoidOffsetTarget = new THREE.Vector3(0, 0, 0)
    const AVOID_DISTANCE = 1.8
    const AVOID_ZONE_RADIUS = 0.65
    const HOVER_ZONE_RADIUS = 0.45
    const APPROACHES_NEEDED = 3
    const CURIOUS_HOVER_THRESHOLD = 0.3
    const ENGAGED_RESET_TIME = 5.0

    const ndc = new THREE.Vector3()

    function getCursorDistanceFromCreature(): number {
      ndc.set(BLOB_BASE_X + avoidOffset.x, avoidOffset.y, 0).project(camera)
      const mx = mouse.x * 2 - 1
      const my = mouse.y * 2 - 1
      return Math.hypot(ndc.x - mx, ndc.y - my)
    }

    function updateStateMachine(dt: number, cursorDist: number, idleSec: number) {
      const inApproachZone = cursorDist < AVOID_ZONE_RADIUS
      const inHoverZone = cursorDist < HOVER_ZONE_RADIUS

      switch (creatureState) {
        case 'avoid': {
          if (!inApproachZone && wasInApproachZone) {
            approachCount++
          }
          if (approachCount >= APPROACHES_NEEDED) {
            creatureState = 'curious'
            approachCount = 0
          }
          break
        }
        case 'curious': {
          if (inHoverZone) {
            curiousHoverTime += dt
          } else {
            curiousHoverTime = Math.max(0, curiousHoverTime - dt * 0.5)
          }
          if (curiousHoverTime >= CURIOUS_HOVER_THRESHOLD) {
            creatureState = 'engaged'
            curiousHoverTime = 0
          }
          if (idleSec > 8) {
            creatureState = 'avoid'
            approachCount = 0
            curiousHoverTime = 0
          }
          break
        }
        case 'engaged': {
          let engagedLeaveTime = 0
          if (!inHoverZone) {
            engagedLeaveTime += dt
          } else {
            engagedLeaveTime = 0
          }
          if (engagedLeaveTime >= ENGAGED_RESET_TIME) {
            creatureState = 'avoid'
            approachCount = 0
            engagedLeaveTime = 0
            curiousHoverTime = 0
          }
          break
        }
      }
      wasInApproachZone = inApproachZone
      if (creatureState !== lastCreatureState) {
        lastCreatureState = creatureState
      }
    }

    // ============================================
    // MAIN LOOP
    // ============================================
    let time = 0
    const clock = new THREE.Clock()
    let rafId = 0

    let lastLabel = ''
    function setLabel(label: string, nav: string, color: string) {
      if (label === lastLabel) return
      lastLabel = label
      onStatusChange?.(label, nav, color)
    }

    let vitalAcc = 0
    function updateVitals(dt: number, totalStretch: number) {
      vitalAcc += dt
      if (vitalAcc < 0.2) return
      vitalAcc = 0
      const resp = breathRate.toFixed(2) + ' Hz'
      let elast = 'NOMINAL'
      if (jiggleAmount > 0.3) elast = 'OSCILLATING'
      else if (totalStretch > 0.2) elast = 'DEFORMING'
      const aware = Math.round(awareness * 100) + '%'
      onVitalsUpdate?.(resp, elast, aware)
    }

    function animate() {
      rafId = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      time += dt

      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.12
      smoothMouse.y += (mouse.y - smoothMouse.y) * 0.12
      const vdx = mouse.x - lastMouse.x
      const vdy = mouse.y - lastMouse.y
      const instSpeed = Math.hypot(vdx, vdy) / Math.max(dt, 0.001)
      mouseSpeed = mouseSpeed * 0.85 + instSpeed * 0.15
      lastMouse.x = mouse.x
      lastMouse.y = mouse.y

      camera.position.x += ((smoothMouse.x - 0.5) * 1.5 - camera.position.x) * 0.04
      camera.position.y += ((smoothMouse.y - 0.5) * 1.0 - camera.position.y) * 0.04
      camera.lookAt(0, 0, 0)

      const cursorDist = getCursorDistanceFromCreature()
      isHovering = cursorDist < HOVER_ZONE_RADIUS && isMouseActive
      const idleSec = (performance.now() / 1000) - lastMoveTime

      updateStateMachine(dt, cursorDist, idleSec)

      // AVOID
      if (creatureState === 'avoid') {
        const cursorWorldX = (smoothMouse.x - 0.5) * 12
        const cursorWorldY = (smoothMouse.y - 0.5) * 8
        const blobX = BLOB_BASE_X
        const blobY = 0
        const dx = blobX - cursorWorldX
        const dy = blobY - cursorWorldY
        const dist = Math.hypot(dx, dy)
        if (dist > 0.1 && cursorDist < AVOID_ZONE_RADIUS * 2) {
          const avoidStrength = Math.max(0, 1 - cursorDist / (AVOID_ZONE_RADIUS * 2))
          avoidOffsetTarget.set(
            (dx / dist) * AVOID_DISTANCE * avoidStrength,
            (dy / dist) * AVOID_DISTANCE * avoidStrength * 0.6,
            0
          )
        } else {
          avoidOffsetTarget.set(0, 0, 0)
        }
      } else {
        avoidOffsetTarget.set(0, 0, 0)
      }
      avoidOffset.lerp(avoidOffsetTarget, 1 - Math.exp(-dt * 3.0))

      // Update blob position
      const blobX = BLOB_BASE_X + avoidOffset.x
      const blobY = avoidOffset.y
      blob.position.x = blobX
      blob.position.y = blobY
      glowDisc.position.x = BLOB_BASE_X + avoidOffset.x * 0.5

      // Update floor uniforms with blob position
      floorMat.uniforms.uBlobPos.value.set(blobX, blobY, 0)

      // AWARENESS
      let awareTarget = 0
      if (isMouseActive && idleSec < 4) {
        if (creatureState === 'engaged' && isHovering) {
          awareTarget = 0.9
        } else if (creatureState === 'curious') {
          awareTarget = 0.25
        } else if (creatureState === 'avoid') {
          awareTarget = 0.1
        }
      }
      awareness += (awareTarget - awareness) * (1 - Math.exp(-dt * 2.0))

      // JELLY SPRING (engaged only)
      if (creatureState === 'engaged' && isHovering) {
        const cursorWorldX = (smoothMouse.x - 0.5) * 12
        const cursorWorldY = (smoothMouse.y - 0.5) * 7
        const dx = cursorWorldX - blobX
        const dy = cursorWorldY - blobY
        const mag = Math.min(0.45, Math.hypot(dx, dy) * 0.12)
        if (mag > 0.001) {
          stretchTarget.set(dx, dy, 0).normalize().multiplyScalar(mag)
        } else {
          stretchTarget.set(0, 0, 0)
        }
      } else {
        stretchTarget.set(0, 0, 0)
      }

      const fX =
        (stretchTarget.x - stretchVec.x) * STRETCH_STIFFNESS - stretchVel.x * STRETCH_DAMPING
      const fY =
        (stretchTarget.y - stretchVec.y) * STRETCH_STIFFNESS - stretchVel.y * STRETCH_DAMPING
      const fZ =
        (stretchTarget.z - stretchVec.z) * STRETCH_STIFFNESS - stretchVel.z * STRETCH_DAMPING
      stretchVel.x += fX * dt
      stretchVel.y += fY * dt
      stretchVel.z += fZ * dt
      stretchVec.x += stretchVel.x * dt
      stretchVec.y += stretchVel.y * dt
      stretchVec.z += stretchVel.z * dt

      const stretchMag = stretchVec.length()
      if (stretchMag > 0.001) {
        mat.uniforms.uStretchAxis.value.copy(stretchVec).divideScalar(stretchMag)
        mat.uniforms.uStretchAmount.value = Math.min(0.6, stretchMag)
      } else {
        mat.uniforms.uStretchAmount.value = 0
      }

      jiggleAmount *= Math.exp(-dt * 1.4)
      if (jiggleAmount < 0.005) jiggleAmount = 0
      mat.uniforms.uJiggleAxis.value.copy(jiggleAxis)
      mat.uniforms.uJiggleAmount.value = jiggleAmount

      if (creatureState === 'engaged' && isHovering && mouseSpeed > 2.0) {
        jiggleAmount = Math.min(1.0, jiggleAmount + (mouseSpeed - 2.0) * 0.04)
      }

      clickPulse *= 0.92
      mat.uniforms.uClickPulse.value = clickPulse
      mat.uniforms.uClickCenter.value.copy(clickCenter)

      // SACCADE / FOCUS
      const cw = new THREE.Vector3(
        (smoothMouse.x - 0.5) * 14 + blobX,
        (smoothMouse.y - 0.5) * 10 + blobY,
        6
      )
      if (time > nextSaccadeAt) {
        if (Math.random() < 0.4 && time > saccadeUntil + 1.5) {
          focusTarget.set((Math.random() - 0.5) * 12 + blobX, (Math.random() - 0.5) * 8 + blobY, 4)
          saccadeUntil = time + 0.3 + Math.random() * 0.4
        }
        nextSaccadeAt = time + 1.8 + Math.random() * 2.5
      }
      if (time > saccadeUntil) {
        if (awareness > 0.2) focusTarget.copy(cw)
        else focusTarget.set(Math.sin(time * 0.13) * 4 + blobX, Math.cos(time * 0.09) * 2.5 + blobY, 4)
      }
      const fk =
        time < saccadeUntil ? 1 - Math.exp(-dt * 18) : 1 - Math.exp(-dt * 4)
      focus.lerp(focusTarget, fk)
      mat.uniforms.uFocus.value.copy(focus)
      mat.uniforms.uAwareness.value = awareness

      // BREATHING
      if (creatureState === 'avoid') {
        breathRate = 0.5
        breathAmp = 0.03
      } else if (creatureState === 'curious') {
        breathRate = 0.2
        breathAmp = 0.04
      } else if (time > nextBreathShiftAt) {
        const roll = Math.random()
        if (roll < 0.15) {
          breathRate = 0.1
          breathAmp = 0.025
        } else if (roll < 0.25) {
          breathRate = 0.18
          breathAmp = 0.1
        } else {
          breathRate = 0.28 + Math.random() * 0.25
          breathAmp = 0.04 + Math.random() * 0.025
        }
        nextBreathShiftAt = time + 3 + Math.random() * 4
      }
      mat.uniforms.uBreathRate.value = breathRate
      mat.uniforms.uBreathAmp.value = breathAmp

      // SURFACE WAVES
      if (creatureState !== 'avoid' && time > nextPulseAt) {
        const strength = 0.25 + Math.random() * 0.35 + awareness * 0.25
        if (awareness > 0.4 && Math.random() < 0.5) {
          const f = focus.clone().normalize()
          const j = new THREE.Vector3(
            (Math.random() - 0.5) * 0.7,
            (Math.random() - 0.5) * 0.7,
            (Math.random() - 0.5) * 0.7
          )
          const dir = f.add(j).normalize()
          emitPulseDir(dir, strength, time)
        } else {
          const theta = Math.random() * Math.PI * 2
          const u = Math.random() * 2 - 1
          const s = Math.sqrt(1 - u * u)
          emitPulseDir(
            new THREE.Vector3(s * Math.cos(theta), u, s * Math.sin(theta)),
            strength,
            time
          )
        }
        nextPulseAt = time + 1.0 + Math.random() * 1.4
      }
      for (let i = 0; i < MAX_PULSES; i++) {
        if (time - pulseUniforms[i].w > 4.0) pulseStrengths[i] = 0
      }
      mat.uniforms.uPulses.value = pulseUniforms
      mat.uniforms.uPulseStrengths.value = pulseStrengths

      mat.uniforms.uTime.value = time
      glowMat.uniforms.uTime.value = time
      floorMat.uniforms.uTime.value = time

      // Rotation
      const rotSpeed = creatureState === 'avoid' ? 0.004 : 0.0025
      blob.rotation.y += rotSpeed + focus.x * 0.00008 * awareness
      blob.rotation.x = Math.sin(time * 0.1) * 0.05

      // STATUS
      if (creatureState === 'avoid') {
        if (approachCount > 0) {
          setLabel(`SUBJECT: CAUTIOUS // APPROACH ${approachCount}/${APPROACHES_NEEDED}`, 'CONTAINMENT: EVASIVE', '#7a6a58')
        } else {
          setLabel('SUBJECT: DORMANT // OBSERVING', 'CONTAINMENT: STABLE', '#606068')
        }
      } else if (creatureState === 'curious') {
        setLabel('SUBJECT: CURIOUS // ASSESSING', 'CONTAINMENT: TOLERANT', '#6a7a68')
      } else if (creatureState === 'engaged') {
        if (jiggleAmount > 0.4) {
          setLabel('SUBJECT: OSCILLATING // ELASTIC RESPONSE', 'CONTAINMENT: PERTURBED', '#a0a0a8')
        } else if (awareness > 0.6) {
          setLabel('SUBJECT: AWARE // TRACKING', 'CONTAINMENT: ATTENTIVE', '#d0d0d8')
        } else if (idleSec > 8) {
          setLabel('SUBJECT: DREAMING // SUBSURFACE PULSE', 'CONTAINMENT: STABLE', '#505058')
        } else {
          setLabel('SUBJECT: ENGAGED // RESPONSIVE', 'CONTAINMENT: INTERACTIVE', '#a0a8b0')
        }
      }
      updateVitals(dt, stretchMag)

      onAwarenessChange?.(awareness, jiggleAmount)

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('click', handleClick)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      glowGeo.dispose()
      glowMat.dispose()
      floorGeo.dispose()
      floorMat.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [onAwarenessChange, onVitalsUpdate, onStatusChange])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
      }}
    />
  )
}
