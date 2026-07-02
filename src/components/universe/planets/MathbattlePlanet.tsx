import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import PlanetBody from '../PlanetBody';
import { getProject } from '../../../data/content';
import type { PlanetProps } from '../types';

/* Símbolos matemáticos que orbitan y se disparan como proyectiles. */
const SYMS = ['+', '−', '×', '÷', '=', 'π', '√', '∑', '∞', '%', '∫', '≈'];

/* Anillos concéntricos tipo Saturno: [radioFactor, grosor, opacidad]. */
const RINGS: ReadonlyArray<readonly [number, number, number]> = [
  [1.42, 0.10, 0.55],
  [1.62, 0.05, 0.40],
  [1.80, 0.13, 0.62],
  [2.04, 0.04, 0.30],
];

/* Textura de bandas atmosféricas: franjas azules horizontales dibujadas a mano. */
function makeBandTexture(color: string, accent: string): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0b2a4a');
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, '#0b2a4a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Franjas de distinto tono / opacidad, onduladas para parecer gas.
  let y = 0;
  let i = 0;
  while (y < h) {
    const band = 6 + ((i * 13) % 22);
    const light = i % 2 === 0;
    ctx.fillStyle = light ? accent : '#1e5a8f';
    ctx.globalAlpha = light ? 0.30 : 0.45;
    ctx.beginPath();
    const wob = 4 + (i % 3) * 3;
    for (let x = 0; x <= w; x += 8) {
      const yy = y + Math.sin((x / w) * Math.PI * 4 + i) * wob;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    for (let x = w; x >= 0; x -= 8) {
      const yy = y + band + Math.sin((x / w) * Math.PI * 4 + i) * wob;
      ctx.lineTo(x, yy);
    }
    ctx.closePath();
    ctx.fill();
    y += band;
    i++;
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

/* Textura por símbolo: glifo blanco con glow del color de acento. */
function makeSymbolTexture(sym: string, accent: string): THREE.CanvasTexture {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.font = 'bold 90px "Space Grotesk Variable", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Halo de acento.
  ctx.shadowColor = accent;
  ctx.shadowBlur = 26;
  ctx.fillStyle = accent;
  ctx.fillText(sym, size / 2, size / 2 + 4);
  // Núcleo blanco nítido.
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(sym, size / 2, size / 2 + 4);
  ctx.shadowBlur = 0;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface Projectile {
  tex: THREE.CanvasTexture;
  angle0: number;
  spin: number;
  phase0: number;
  rate: number;
  ring: number; // factor de radio base desde el que orbita
}

export default function MathbattlePlanet({ onApproach, onHover }: PlanetProps) {
  const project = getProject('mathbattle')!;
  const p = project.planet;
  const R = p.radius;
  const [hovered, setHovered] = useState(false);

  const planet = useRef<THREE.Mesh>(null);
  const planetMat = useRef<THREE.MeshStandardMaterial>(null);
  const ringSystem = useRef<THREE.Group>(null);
  const ringMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const spriteRefs = useRef<(THREE.Sprite | null)[]>([]);
  const rimMat = useRef<THREE.MeshBasicMaterial>(null);

  // Suavizado del estado de hover para transiciones fluidas (0 → 1).
  const hoverK = useRef(0);

  // Textura de bandas (una sola, en cleanup).
  const bandTex = useMemo(() => makeBandTexture(p.color, p.accent), [p.color, p.accent]);
  useEffect(() => () => bandTex.dispose(), [bandTex]);

  // Proyectiles: cada uno con su textura de símbolo y parámetros de órbita/disparo.
  const projectiles = useMemo<Projectile[]>(
    () =>
      SYMS.map((sym, i) => ({
        tex: makeSymbolTexture(sym, p.accent),
        angle0: (i / SYMS.length) * Math.PI * 2,
        spin: 0.20 + (i % 4) * 0.06,
        phase0: i / SYMS.length,
        rate: 0.16 + (i % 5) * 0.03,
        ring: RINGS[i % RINGS.length][0],
      })),
    [p.accent],
  );
  useEffect(() => () => projectiles.forEach((s) => s.tex.dispose()), [projectiles]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Suaviza hover.
    hoverK.current += ((hovered ? 1 : 0) - hoverK.current) * Math.min(1, dt * 8);
    const hk = hoverK.current;

    // Rotación del planeta + scroll de bandas (sin allocations).
    if (planet.current) planet.current.rotation.y += dt * 0.16;
    bandTex.offset.x += dt * 0.015;
    if (planetMat.current) planetMat.current.emissiveIntensity = 0.22 + hk * 0.45;

    // Anillos: giran y brillan con el hover.
    if (ringSystem.current) ringSystem.current.rotation.z += dt * (0.18 + hk * 0.55);
    for (let r = 0; r < RINGS.length; r++) {
      const m = ringMats.current[r];
      if (m) {
        const base = RINGS[r][2];
        m.opacity = base + hk * 0.35 + Math.sin(t * 1.4 + r) * 0.05;
      }
    }
    if (rimMat.current) rimMat.current.opacity = 0.28 + hk * 0.4;

    // Proyectiles: orbitan en el plano de los anillos y se disparan hacia fuera.
    const speed = 1 + hk * 2.2; // hover acelera la lluvia de disparos
    const reach = R * (2.4 + hk * 1.4);
    for (let i = 0; i < projectiles.length; i++) {
      const sp = spriteRefs.current[i];
      if (!sp) continue;
      const s = projectiles[i];
      const phase = (t * s.rate * speed + s.phase0) % 1;
      const angle = s.angle0 + t * s.spin;
      const rad = R * s.ring + phase * reach;
      // Plano del anillo (X-Z); el group lo inclina como Saturno.
      sp.position.set(Math.cos(angle) * rad, Math.sin(angle * 0.5) * 0.15, Math.sin(angle) * rad);
      const sc = 0.5 + phase * (0.7 + hk * 0.6);
      sp.scale.setScalar(sc);
      const mat = sp.material as THREE.SpriteMaterial;
      // Aparece rápido y se desvanece al alejarse (estela de "disparo").
      mat.opacity = Math.min(1, phase * 6) * (1 - phase) * (0.7 + hk * 0.3);
    }
  });

  const payload = {
    id: project.id,
    position: p.position,
    radius: p.radius,
    label: project.name,
    sublabel: project.tagline,
    url: project.url,
    project,
  };

  return (
    <PlanetBody
      position={p.position}
      colliderRadius={R * 2.2}
      ringRadius={R * 1.25}
      accent={p.accent}
      label={project.name}
      sublabel={project.tagline}
      hovered={hovered}
      onOver={() => setHovered(true)}
      onOut={() => setHovered(false)}
      approach={payload}
      onHover={onHover}
      onClick={() => onApproach(payload)}
    >
      {/* Planeta helado con bandas atmosféricas */}
      <mesh ref={planet}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial
          ref={planetMat}
          map={bandTex}
          color={p.color}
          roughness={0.45}
          metalness={0.12}
          emissive="#1e3a5f"
          emissiveMap={bandTex}
          emissiveIntensity={0.22}
        />
      </mesh>

      {/* Atmósfera interior */}
      <mesh>
        <sphereGeometry args={[R * 1.12, 32, 32]} />
        <meshBasicMaterial
          color="#bae6fd"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Rim glow exterior (esfera mayor, BackSide + Additive) */}
      <mesh>
        <sphereGeometry args={[R * 1.3, 32, 32]} />
        <meshBasicMaterial
          ref={rimMat}
          color={p.accent}
          transparent
          opacity={0.28}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Sistema de anillos tipo Saturno + proyectiles de símbolos */}
      <group ref={ringSystem} rotation={[Math.PI * 0.46, 0, 0.22]}>
        {RINGS.map(([rf, thick, op], r) => (
          <mesh key={r} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[R * rf, thick, 16, 96]} />
            <meshBasicMaterial
              ref={(el) => {
                ringMats.current[r] = el;
              }}
              color={p.accent}
              transparent
              opacity={op}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}

        {projectiles.map((s, i) => (
          <sprite
            key={i}
            ref={(el) => {
              spriteRefs.current[i] = el;
            }}
          >
            <spriteMaterial
              map={s.tex}
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        ))}
      </group>

      {/* Polvo de partículas de acento alrededor del sistema */}
      <Sparkles
        count={40}
        scale={R * 4}
        size={hovered ? 4 : 2.2}
        speed={hovered ? 0.6 : 0.25}
        color={p.accent}
        opacity={0.7}
      />

      {/* Destello frontal que mira a cámara, refuerza el brillo en hover */}
      <Billboard>
        <mesh>
          <circleGeometry args={[R * 0.5, 32]} />
          <meshBasicMaterial
            color={p.accent}
            transparent
            opacity={0.0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
    </PlanetBody>
  );
}
