import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// BackgroundBlob — passive jiggling alien creature in the background.
// Wanders slowly, no interaction. Used on the Portfolio page.

export default function BackgroundBlob() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Tiny simplex noise for organic wandering
    const PERM = new Uint8Array(512)
    const GRAD3: number[][] = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
    ]
    ;(function initNoise() {
      const p = new Uint8Array(256)
      for (let i = 0; i < 256; i++) p[i] = i
      for (let i = 255; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1))
        ;[p[i], p[r]] = [p[r], p[i]]
      }
      for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]
    })()

    function snoise3(x: number, y: number, z: number): number {
      const X = Math.floor(x) & 255
      const Y = Math.floor(y) & 255
      const Z = Math.floor(z) & 255
      const fx = x - Math.floor(x)
      const fy = y - Math.floor(y)
      const fz = z - Math.floor(z)
      const u = fx * fx * (3 - 2 * fx)
      const v = fy * fy * (3 - 2 * fy)
      const w = fz * fz * (3 - 2 * fz)
      const grad = (hash: number, dx: number, dy: number, dz: number) => {
        const g = GRAD3[hash % 12]
        return g[0] * dx + g[1] * dy + g[2] * dz
      }
      const n000 = grad(PERM[PERM[PERM[X] + Y] + Z], fx, fy, fz)
      const n100 = grad(PERM[PERM[PERM[X + 1] + Y] + Z], fx - 1, fy, fz)
      const n010 = grad(PERM[PERM[PERM[X] + Y + 1] + Z], fx, fy - 1, fz)
      const n110 = grad(PERM[PERM[PERM[X + 1] + Y + 1] + Z], fx - 1, fy - 1, fz)
      const n001 = grad(PERM[PERM[PERM[X] + Y] + Z + 1], fx, fy, fz - 1)
      const n101 = grad(PERM[PERM[PERM[X + 1] + Y] + Z + 1], fx - 1, fy, fz - 1)
      const n011 = grad(PERM[PERM[PERM[X] + Y + 1] + Z + 1], fx, fy - 1, fz - 1)
      const n111 = grad(PERM[PERM[PERM[X + 1] + Y + 1] + Z + 1], fx - 1, fy - 1, fz - 1)
      const nx00 = n000 + (n100 - n000) * u
      const nx10 = n010 + (n110 - n010) * u
      const nx01 = n001 + (n101 - n001) * u
      const nx11 = n011 + (n111 - n011) * u
      const nxy0 = nx00 + (nx10 - nx00) * v
      const nxy1 = nx01 + (nx11 - nx01) * v
      return nxy0 + (nxy1 - nxy0) * w
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 12)

    const SPHERE_RADIUS = 3.0
    const geo = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 48)

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;

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

        void main() {
            vec3 pos = position;
            vec3 nrm = normalize(normal);
            float w1 = fbm(pos * 0.55 + uTime * 0.25);
            float w2 = fbm(pos * 1.1  + vec3(50.0) + uTime * 0.4);
            float idleWobble = w1 * 0.14 + w2 * 0.06;
            pos += nrm * idleWobble;
            float breathe = sin(uTime * 0.30 * 6.2831) * 0.05;
            pos *= 1.0 + breathe;
            vPosition = pos;
            vNormal = normalize(nrm + vec3(w1*0.06, w2*0.06, 0.0));
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vec3 keyDir  = normalize(vec3( 0.6,  0.8,  0.7));
            vec3 fillDir = normalize(vec3(-0.7, -0.3,  0.4));
            vec3 viewDir = normalize(-vPosition);
            vec3 halfKey = normalize(keyDir + viewDir);
            vec3 baseColor = vec3(0.035, 0.040, 0.065);
            float diffKey  = max(dot(vNormal, keyDir),  0.0);
            float diffFill = max(dot(vNormal, fillDir), 0.0);
            float spec = pow(max(dot(vNormal, halfKey), 0.0), 70.0);
            float spec2 = pow(max(dot(vNormal, halfKey), 0.0), 18.0) * 0.25;
            float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
            float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);
            vec3 iridA = vec3(0.50, 0.65, 0.90);
            vec3 iridB = vec3(0.80, 0.60, 0.70);
            vec3 specTint = mix(vec3(0.80), mix(iridA, iridB, sin(fresnel * 6.28) * 0.5 + 0.5), 0.6);
            vec3 color = baseColor;
            color += vec3(0.20, 0.22, 0.35) * diffKey;
            color += vec3(0.14, 0.08, 0.12) * diffFill;
            color += specTint * spec * 1.3;
            color += vec3(0.25, 0.27, 0.40) * spec2;
            color += vec3(0.25, 0.30, 0.50) * rim * 0.35;
            color += vec3(0.12, 0.15, 0.28) * fresnel * 0.5;
            gl_FragColor = vec4(color, 0.40);
        }
      `,
    })

    const blob = new THREE.Mesh(geo, mat)
    scene.add(blob)

    const glowGeo = new THREE.PlaneGeometry(14, 14)
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
            float d = distance(vUv, vec2(0.5));
            float alpha = smoothstep(0.35, 0.0, d) * 0.06;
            gl_FragColor = vec4(0.05, 0.06, 0.10, alpha);
        }
      `,
    })
    const glowDisc = new THREE.Mesh(glowGeo, glowMat)
    glowDisc.position.z = -4
    scene.add(glowDisc)

    let time = 0
    let rafId = 0
    const clock = new THREE.Clock()

    const WANDER_SPEED = 0.12
    const WANDER_RANGE_X = 5.0
    const WANDER_RANGE_Y = 2.5

    function animate() {
      rafId = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      time += dt

      mat.uniforms.uTime.value = time
      glowMat.uniforms.uTime.value = time

      const wanderX = snoise3(time * WANDER_SPEED, 0, 0) * WANDER_RANGE_X
      const wanderY = snoise3(0, time * WANDER_SPEED * 0.7, 100) * WANDER_RANGE_Y

      blob.position.x += (wanderX - blob.position.x) * 0.02
      blob.position.y += (wanderY - blob.position.y) * 0.02
      glowDisc.position.x += (wanderX * 0.5 - glowDisc.position.x) * 0.015
      glowDisc.position.y += (wanderY * 0.3 - glowDisc.position.y) * 0.015

      const rotSpeed = 0.001 + Math.abs(wanderX - blob.position.x) * 0.0005
      blob.rotation.y += rotSpeed
      blob.rotation.x = Math.sin(time * 0.08) * 0.06 + snoise3(time * 0.05, 50, 50) * 0.03
      blob.rotation.z = Math.cos(time * 0.06) * 0.025

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
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      glowGeo.dispose()
      glowMat.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.35,
      }}
    />
  )
}
