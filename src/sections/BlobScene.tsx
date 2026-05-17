import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// blob-scene.tsx — Three.js "alive" blob with local soft-body reactions.
//
// Interaction model:
//   • Raycast cursor → exact surface point in blob-local space
//   • HOVER  → Gaussian bulge at that point
//   • CLICK  → poke pool (up to 6 simultaneous): inward dent + overshoot bounce
//              + travelling wave that ripples outward across nearby vertices

const MAX_POKES = 6

export interface BlobActivity {
  hover: number
  avoid: number
  clickEnergy: number
  waveEnergy: number
  sinceClick: number
}

interface BlobSceneProps {
  palette?: [string, string, string, string] | string[]
  spinSpeed?: number
  jiggleAmount?: number
  avoidStrength?: number
  shadow?: boolean
  onActivity?: (a: BlobActivity) => void
}

export default function BlobScene({
  palette = ['#161e44', '#4d6dc4', '#a3b9ed', '#ffffff'],
  spinSpeed = 0.10,
  jiggleAmount = 0.55,
  avoidStrength = 0.45,
  shadow = true,
  onActivity,
}: BlobSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const propsRef = useRef({ palette, spinSpeed, jiggleAmount, avoidStrength, shadow })
  const onActivityRef = useRef(onActivity)

  useEffect(() => {
    propsRef.current = { palette, spinSpeed, jiggleAmount, avoidStrength, shadow }
  }, [palette, spinSpeed, jiggleAmount, avoidStrength, shadow])

  useEffect(() => {
    onActivityRef.current = onActivity
  }, [onActivity])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const rect = () => container.getBoundingClientRect()
    let { width, height } = rect()
    // Set the internal buffer size but DO NOT let three.js write
    // canvas.style.width/height — if it did, the canvas CSS size would
    // become the *scaled* pixel size, which the parent transform: scale()
    // then scales again, making the canvas overflow .blob-wrap and
    // misaligning the visual canvas vs. the hit-testing rect we read
    // from the container. Forcing the canvas CSS to fill its parent
    // (100%/100%) keeps the canvas visual = container visual, so a
    // pointer at the cursor maps to the same NDC the raycaster expects.
    renderer.setSize(width, height, false)
    container.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.pointerEvents = 'auto'
    renderer.domElement.style.cursor = 'crosshair'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 0, 11)
    camera.lookAt(0, 0, 0)

    const SPHERE_RADIUS = 2.6
    const geo = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 64)

    // ---- Poke uniforms ----
    const pokePositions: THREE.Vector3[] = []
    const pokeData: THREE.Vector3[] = []
    for (let i = 0; i < MAX_POKES; i++) {
      pokePositions.push(new THREE.Vector3(0, 0, 0))
      pokeData.push(new THREE.Vector3(-1000, 0, 1))
    }

    const hexToVec3 = (hex: string) => {
      const c = new THREE.Color(hex)
      return new THREE.Vector3(c.r, c.g, c.b)
    }

    const mat = new THREE.ShaderMaterial({
      transparent: false,
      uniforms: {
        uTime:        { value: 0 },
        uJiggle:      { value: jiggleAmount },
        uBase:        { value: hexToVec3(palette[0]) },
        uLit:         { value: hexToVec3(palette[1]) },
        uRim:         { value: hexToVec3(palette[2]) },
        uSpec:        { value: hexToVec3(palette[3]) },
        uHoverPoint:  { value: new THREE.Vector3(0, 0, SPHERE_RADIUS) },
        uHoverAmt:    { value: 0.0 },
        uHoverRadius: { value: 1.05 },
        uPokePos:     { value: pokePositions },
        uPokeData:    { value: pokeData },
      },
      vertexShader: `
        #define MAX_POKES ${MAX_POKES}
        uniform float uTime;
        uniform float uJiggle;
        uniform vec3  uHoverPoint;
        uniform float uHoverAmt;
        uniform float uHoverRadius;
        uniform vec3  uPokePos[MAX_POKES];
        uniform vec3  uPokeData[MAX_POKES];

        varying vec3  vNormal;
        varying vec3  vPosition;
        varying float vFres;
        varying float vHoverProx;
        varying float vDentDark;
        varying float vWaveGlow;

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
          for(int i=0;i<4;i++){v+=a*snoise(p*f);a*=0.5;f*=2.1;}
          return v;
        }

        void main(){
          vec3 pos = position;
          vec3 nrm = normalize(normal);

          float w1 = fbm(pos * 0.55 + uTime * 0.18);
          float w2 = fbm(pos * 1.15 + vec3(50.0) + uTime * 0.32);
          float w3 = fbm(pos * 2.20 + vec3(-20.0) + uTime * 0.55);
          float wobble = (w1 * 0.16 + w2 * 0.07 + w3 * 0.03) * uJiggle;
          pos += nrm * wobble;

          float breathe = sin(uTime * 0.28 * 6.2831) * 0.04;
          pos *= 1.0 + breathe;

          float dh = distance(position, uHoverPoint);
          float hG = exp(-(dh * dh) / (uHoverRadius * uHoverRadius));
          float hoverBulge = hG * uHoverAmt * 0.55;
          pos += nrm * hoverBulge;
          vHoverProx = hG * uHoverAmt;

          float dentDark = 0.0;
          float waveGlow = 0.0;
          float pokeDeform = 0.0;
          for (int i = 0; i < MAX_POKES; i++) {
            float startT   = uPokeData[i].x;
            float strength = uPokeData[i].y;
            float radius   = uPokeData[i].z;
            float t = uTime - startT;
            if (t < 0.0 || t > 2.4 || strength < 0.001) continue;

            float d = distance(position, uPokePos[i]);
            float g = exp(-(d * d) / (radius * radius));

            float dent = g * exp(-t * 3.8) * strength;
            float spring = g * sin(t * 13.0) * exp(-t * 3.2) * strength * 0.55;

            float wavePos  = t * 1.95;
            float waveBand = exp(-pow((d - wavePos) * 3.4, 2.0));
            float waveEnv  = exp(-t * 1.2) * strength;
            float waveGate = smoothstep(0.04, 0.18, t);
            float wave     = waveBand * waveEnv * waveGate * 0.36;

            pokeDeform += (-dent + spring + wave);
            dentDark   += dent;
            waveGlow   += waveBand * waveEnv * waveGate;
          }
          pos += nrm * pokeDeform;
          vDentDark = dentDark;
          vWaveGlow = waveGlow;

          vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
          vec3 viewDir = normalize(cameraPosition - worldPos);
          vec3 worldNrm = normalize(mat3(modelMatrix) * nrm);
          vFres = pow(1.0 - max(dot(viewDir, worldNrm), 0.0), 2.4);

          vNormal = normalize(nrm + vec3(w1*0.06, w2*0.06, 0.0));
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uBase;
        uniform vec3 uLit;
        uniform vec3 uRim;
        uniform vec3 uSpec;
        varying vec3  vNormal;
        varying vec3  vPosition;
        varying float vFres;
        varying float vHoverProx;
        varying float vDentDark;
        varying float vWaveGlow;

        void main(){
          vec3 keyDir   = normalize(vec3( 0.55,  0.85,  0.50));
          vec3 fillDir  = normalize(vec3(-0.70, -0.15,  0.45));
          vec3 backDir  = normalize(vec3( 0.10,  0.40, -0.90));
          vec3 viewDir  = normalize(-vPosition);
          vec3 halfKey  = normalize(keyDir  + viewDir);
          vec3 halfBack = normalize(backDir + viewDir);

          float diffKey  = max(dot(vNormal, keyDir),  0.0);
          float diffBack = max(dot(vNormal, backDir), 0.0);
          float wrapFill = max(0.0, (dot(vNormal, fillDir) + 0.35) / 1.35);

          float skyMix = vNormal.y * 0.5 + 0.5;
          vec3 ambient = mix(uBase * 0.85, mix(uBase, uLit, 0.35), skyMix);

          vec3 col = ambient;
          col += uLit  * diffKey * 1.05;
          col += mix(uBase, uLit, 0.50) * wrapFill * 0.55;
          col += uRim  * diffBack * 0.38;

          float spec1 = pow(max(dot(vNormal, halfKey),  0.0), 120.0);
          float spec2 = pow(max(dot(vNormal, halfKey),  0.0),  24.0) * 0.30;
          float specBack = pow(max(dot(vNormal, halfBack), 0.0), 70.0) * 0.55;

          vec3 specTint = mix(uSpec, uRim, vFres);
          col += specTint * spec1 * 2.10;
          col += uRim  * spec2;
          col += uSpec * specBack * 0.85;

          float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.6);
          col += uRim  * rim * 0.65;
          col += uSpec * vFres * 0.18;

          float bottomShadow = smoothstep(-0.9, 0.2, -vNormal.y) * 0.22;
          col *= 1.0 - bottomShadow;

          float hoverShape = pow(clamp(vHoverProx, 0.0, 1.0), 2.6);
          col += uSpec * hoverShape * 0.06;

          float dent = clamp(vDentDark, 0.0, 1.4);
          col = mix(col, uBase * 0.55, dent * 0.55);
          col *= 1.0 - dent * 0.30;

          float glow = clamp(vWaveGlow, 0.0, 1.6);
          col += uRim  * glow * 0.85;
          col += uSpec * glow * 0.35;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })

    const blob = new THREE.Mesh(geo, mat)
    scene.add(blob)

    // Shadow disc
    const shadowGeo = new THREE.PlaneGeometry(8, 4.5)
    const shadowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uOn: { value: shadow ? 1.0 : 0.0 } },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOn;
        void main(){
          vec2 p = vUv - vec2(0.5);
          p.y *= 1.8;
          float d = length(p);
          float a = smoothstep(0.42, 0.0, d) * 0.45 * uOn;
          gl_FragColor = vec4(0.0, 0.0, 0.04, a);
        }
      `,
    })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.position.y = -3.4
    shadowMesh.position.z = -1.2
    scene.add(shadowMesh)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let pointerInside = false
    const tmpV = new THREE.Vector3()
    const hoverLocal = new THREE.Vector3(0, 0, SPHERE_RADIUS)
    const hoverLocalTarget = new THREE.Vector3(0, 0, SPHERE_RADIUS)
    let hoverAmt = 0
    let hoverActive = false
    let nextPokeSlot = 0

    const updatePointer = (e: PointerEvent | MouseEvent) => {
      const r = rect()
      const inside =
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top  && e.clientY <= r.bottom
      pointerInside = inside
      pointer.x = ((e.clientX - r.left) / r.width)  * 2 - 1
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1
    }
    const moveHandler = (e: MouseEvent) => updatePointer(e)
    window.addEventListener('mousemove', moveHandler)

    let lastClickAt = -1000
    const onPointerDown = (e: PointerEvent) => {
      updatePointer(e)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObject(blob, false)
      if (hits.length === 0) return
      tmpV.copy(hits[0].point)
      blob.worldToLocal(tmpV)
      pokePositions[nextPokeSlot].copy(tmpV)
      // (startTime, strength, radius)
      pokeData[nextPokeSlot].set(mat.uniforms.uTime.value, 1.0, 0.95)
      nextPokeSlot = (nextPokeSlot + 1) % MAX_POKES
      lastClickAt = mat.uniforms.uTime.value
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    let time = 0
    let rafId = 0
    const clock = new THREE.Clock()
    const avoidOffset = new THREE.Vector3(0, 0, 0)
    const avoidTarget = new THREE.Vector3(0, 0, 0)
    let lastReport = 0

    function animate() {
      rafId = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      time += dt

      const p = propsRef.current
      mat.uniforms.uTime.value = time
      mat.uniforms.uJiggle.value = p.jiggleAmount
      shadowMat.uniforms.uOn.value = p.shadow ? 1.0 : 0.0

      mat.uniforms.uBase.value.copy(hexToVec3(p.palette[0]))
      mat.uniforms.uLit.value.copy(hexToVec3(p.palette[1]))
      mat.uniforms.uRim.value.copy(hexToVec3(p.palette[2]))
      mat.uniforms.uSpec.value.copy(hexToVec3(p.palette[3]))

      // ---- Raycast for hover ----
      if (pointerInside) {
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObject(blob, false)
        if (hits.length > 0) {
          tmpV.copy(hits[0].point)
          blob.worldToLocal(tmpV)
          hoverLocalTarget.copy(tmpV)
          hoverActive = true
        } else {
          hoverActive = false
        }
      } else {
        hoverActive = false
      }
      // Smooth the hover target so quick movements glide
      hoverLocal.lerp(hoverLocalTarget, 1 - Math.exp(-dt * 18))
      hoverAmt += ((hoverActive ? 1 : 0) - hoverAmt) * (1 - Math.exp(-dt * 7))
      mat.uniforms.uHoverPoint.value.copy(hoverLocal)
      mat.uniforms.uHoverAmt.value = hoverAmt

      // ---- Gentle far-field avoidance — dies off when cursor is on the blob ----
      const mx = pointer.x * 4
      const my = pointer.y * 3
      const dist = Math.hypot(mx, my)
      const farProximity = pointerInside && !hoverActive
        ? Math.max(0, 1 - dist / 4.0)
        : 0
      const avoidGain = farProximity * p.avoidStrength * 1.3
      if (dist > 0.01) {
        avoidTarget.set((-mx / dist) * avoidGain, (-my / dist) * avoidGain, 0)
      } else {
        avoidTarget.set(0, 0, 0)
      }
      avoidOffset.lerp(avoidTarget, 1 - Math.exp(-dt * 1.2))
      blob.position.x = avoidOffset.x
      blob.position.y = avoidOffset.y
      shadowMesh.position.x = avoidOffset.x * 0.6

      // ---- Slow spin ----
      blob.rotation.y += p.spinSpeed * dt
      blob.rotation.x = Math.sin(time * 0.13) * 0.08
      blob.rotation.z = Math.cos(time * 0.10) * 0.05

      if (time - lastReport > 0.14 && onActivityRef.current) {
        let clickEnergy = 0
        let waveEnergy = 0
        for (let i = 0; i < MAX_POKES; i++) {
          const startT = pokeData[i].x
          const strength = pokeData[i].y
          const t = time - startT
          if (t >= 0 && t < 2.4 && strength > 0.001) {
            clickEnergy += Math.exp(-t * 3.8) * strength
            waveEnergy  += Math.exp(-t * 1.2) * strength
          }
        }
        onActivityRef.current({
          hover: hoverAmt,
          avoid: Math.min(1, avoidOffset.length() / 1.6),
          clickEnergy: Math.min(1.5, clickEnergy),
          waveEnergy:  Math.min(1.5, waveEnergy),
          sinceClick: time - lastClickAt,
        })
        lastReport = time
      }

      renderer.render(scene, camera)
    }
    animate()

    const ro = new ResizeObserver(() => {
      const r = rect()
      width = r.width
      height = r.height
      if (width < 4 || height < 4) return
      // Same as initial setup — set buffer resolution, do not touch CSS.
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', moveHandler)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      ro.disconnect()
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      shadowGeo.dispose()
      shadowMat.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
