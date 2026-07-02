import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Instances, Instance, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* Textura radial suave (estrella / brillo). */
function radialTexture(stops: [number, string][]): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Textura de galaxia lejana: núcleo brillante + brazos espirales tenues. */
function galaxyTexture(tint: string): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  const cx = s / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.2, tint);
  g.addColorStop(0.6, 'rgba(120,90,200,0.18)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 5;
  for (let a = 0; a < 2; a++) {
    ctx.beginPath();
    const base = a * Math.PI;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const rad = t * cx * 0.92;
      const ang = base + t * 4.5;
      const x = cx + Math.cos(ang) * rad;
      const y = cx + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const GALAXIES: { pos: [number, number, number]; scale: number; tint: string; spin: number }[] = [
  { pos: [-80, 30, -70], scale: 34, tint: 'rgba(180,130,255,0.5)', spin: 0.02 },
  { pos: [85, -22, -60], scale: 28, tint: 'rgba(120,210,255,0.5)', spin: -0.025 },
  { pos: [10, 48, -95], scale: 44, tint: 'rgba(255,140,210,0.45)', spin: 0.015 },
];

/* ----------------------------- Cometas fugaces ---------------------------- */
const COMET_COUNT = 4;

interface CometState {
  start: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  life: number;
  dur: number;
  delay: number;
}

function spawnComet(): CometState {
  return {
    start: new THREE.Vector3(
      (Math.random() - 0.5) * 170,
      (Math.random() - 0.5) * 95,
      -35 - Math.random() * 75,
    ),
    dir: new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 0.9,
      (Math.random() - 0.5) * 0.7,
    ).normalize(),
    speed: 9 + Math.random() * 13,
    life: 0,
    dur: 2.4 + Math.random() * 3,
    delay: Math.random() * 7,
  };
}

export default function SpaceDecor() {
  const galaxyRefs = useRef<(THREE.Group | null)[]>([]);
  const belt = useRef<THREE.Group>(null);
  const cometRefs = useRef<(THREE.Group | null)[]>([]);
  const cometHeadMat = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const cometTailMat = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const starGlow = useMemo(
    () =>
      radialTexture([
        [0, 'rgba(255,247,230,1)'],
        [0.25, 'rgba(255,220,150,0.7)'],
        [1, 'rgba(255,180,80,0)'],
      ]),
    [],
  );
  const galaxyTex = useMemo(() => GALAXIES.map((g) => galaxyTexture(g.tint)), []);
  useEffect(
    () => () => {
      starGlow.dispose();
      galaxyTex.forEach((t) => t.dispose());
    },
    [starGlow, galaxyTex],
  );

  // Estado mutable de los cometas (posición aleatoria, ciclo de vida con fade).
  const cometStates = useRef<CometState[]>(
    Array.from({ length: COMET_COUNT }, () => spawnComet()),
  );
  const scratch = useMemo(() => new THREE.Vector3(), []);

  // Cinturón de asteroides: posiciones/escala/rotación estáticas.
  const asteroids = useMemo(() => {
    const list: { pos: [number, number, number]; scale: number; rot: [number, number, number] }[] = [];
    const N = 40;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + Math.random() * 0.3;
      const rad = 52 + Math.random() * 26;
      const y = (Math.random() - 0.5) * 26;
      list.push({
        pos: [Math.cos(a) * rad, y, Math.sin(a) * rad - 18],
        scale: 0.5 + Math.random() * 1.8,
        rot: [Math.random() * 6, Math.random() * 6, Math.random() * 6],
      });
    }
    return list;
  }, []);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < galaxyRefs.current.length; i++) {
      const g = galaxyRefs.current[i];
      if (g) g.rotation.z += dt * GALAXIES[i].spin;
    }
    if (belt.current) belt.current.rotation.y += dt * 0.01;

    // Cometas: viajan desde un punto aleatorio, hacen fade in/out y reaparecen.
    for (let i = 0; i < COMET_COUNT; i++) {
      const cm = cometRefs.current[i];
      const head = cometHeadMat.current[i];
      const tail = cometTailMat.current[i];
      const st = cometStates.current[i];
      if (!cm) continue;

      if (st.delay > 0) {
        st.delay -= dt;
        if (head) head.opacity = 0;
        if (tail) tail.opacity = 0;
        continue;
      }

      st.life += dt;
      const p = st.life / st.dur;
      if (p >= 1) {
        cometStates.current[i] = spawnComet();
        cometStates.current[i].delay = 1 + Math.random() * 5;
        if (head) head.opacity = 0;
        if (tail) tail.opacity = 0;
        continue;
      }

      cm.position.copy(st.start).addScaledVector(st.dir, st.speed * st.life);
      scratch.copy(cm.position).add(st.dir);
      cm.lookAt(scratch); // +Z mira en la dirección de avance; la estela va a -Z

      // Fade suave: entra en el primer 20%, sale en el último 35%.
      const op = Math.min(1, p / 0.2) * Math.min(1, (1 - p) / 0.35);
      if (head) head.opacity = op;
      if (tail) tail.opacity = op * 0.6;
    }
  });

  return (
    <group>
      {/* Estrella brillante lejana */}
      <Billboard position={[78, 36, -88]}>
        <mesh>
          <planeGeometry args={[26, 26]} />
          <meshBasicMaterial
            map={starGlow}
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[1.6, 24]} />
          <meshBasicMaterial color="#fff3da" toneMapped={false} />
        </mesh>
      </Billboard>

      {/* Galaxias lejanas */}
      {GALAXIES.map((g, i) => (
        <group
          key={i}
          ref={(el) => {
            galaxyRefs.current[i] = el;
          }}
          position={g.pos}
          rotation={[Math.PI * 0.28 * (i + 1), 0.4 * i, 0]}
        >
          <Billboard>
            <mesh>
              <planeGeometry args={[g.scale, g.scale]} />
              <meshBasicMaterial
                map={galaxyTex[i]}
                transparent
                opacity={0.8}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </Billboard>
        </group>
      ))}

      {/* Cinturón de asteroides instanciado */}
      <group ref={belt}>
        <Instances limit={asteroids.length} range={asteroids.length}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#71757f" roughness={1} metalness={0.2} flatShading />
          {asteroids.map((a, i) => (
            <Instance key={i} position={a.pos} scale={a.scale} rotation={a.rot} />
          ))}
        </Instances>
      </group>

      {/* Cometas fugaces (aparecen en sitios aleatorios y se desvanecen) */}
      {Array.from({ length: COMET_COUNT }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            cometRefs.current[i] = el;
          }}
        >
          <mesh>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshBasicMaterial
              ref={(el) => {
                cometHeadMat.current[i] = el;
              }}
              color="#e6f6ff"
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          {/* Estela: base en la cabeza, punta detrás (-Z) */}
          <mesh position={[0, 0, -2]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.26, 4, 14, 1, true]} />
            <meshBasicMaterial
              ref={(el) => {
                cometTailMat.current[i] = el;
              }}
              color="#7fd8ff"
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Polvo de color flotando en el campo lejano */}
      <Sparkles count={90} scale={[150, 70, 150]} size={2.5} speed={0.18} opacity={0.5} color="#a9b8ff" />
      <Sparkles count={50} scale={[120, 50, 120]} size={3.5} speed={0.12} opacity={0.4} color="#ffd9a0" />
    </group>
  );
}
