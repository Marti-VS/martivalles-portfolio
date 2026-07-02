import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import PlanetBody from '../PlanetBody';
import { getProject } from '../../../data/content';
import type { PlanetProps } from '../types';

// Colores de los logos de cada marca: degorg (naranja), degorgel (azul),
// giropack (rojo), formapack (azul claro).
const BRANDS = ['#f39200', '#3ca6de', '#e2231a', '#a7d2f0'];

/**
 * Textura tipo planeta con CONTINENTES: masas de tierra irregulares en los 4
 * colores de marca sobre un "océano" metálico oscuro (no bandas).
 */
function makeBandsTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  // Base casi BLANCA (formapack) para que destaquen los 4 colores de marca.
  ctx.fillStyle = '#eef3fa';
  ctx.fillRect(0, 0, w, h);
  const sh = ctx.createLinearGradient(0, 0, 0, h);
  sh.addColorStop(0, 'rgba(255,255,255,0.2)');
  sh.addColorStop(0.5, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(80,100,140,0.12)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, w, h);

  // Un continente = cúmulo de círculos solapados (masa orgánica).
  const continent = (cx: number, cy: number, color: string, scale: number) => {
    const base = new THREE.Color(color);
    let x = cx;
    let y = cy;
    const blobs = 18 + Math.floor(Math.random() * 12);
    for (let i = 0; i < blobs; i++) {
      const r = (26 + Math.random() * 46) * scale;
      const col = base.clone().multiplyScalar(0.86 + Math.random() * 0.26);
      ctx.fillStyle = `#${col.getHexString()}`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      x += (Math.random() - 0.5) * 84 * scale;
      y += (Math.random() - 0.5) * 56 * scale;
      y = Math.max(30, Math.min(h - 30, y));
      if (x < 0) x += w;
      if (x > w) x -= w;
    }
  };

  // Grandes masas; el azul (degorgel) bien presente. El blanco queda de fondo.
  continent(w * 0.16, h * 0.4, BRANDS[0], 1.35); // naranja (degorg)
  continent(w * 0.46, h * 0.58, BRANDS[1], 1.55); // azul (degorgel) — grande
  continent(w * 0.8, h * 0.4, BRANDS[2], 1.3); // rojo (giropack)
  continent(w * 0.28, h * 0.84, BRANDS[1], 1.05); // azul (2ª masa)
  continent(w * 0.66, h * 0.85, BRANDS[0], 0.7); // naranja peq
  continent(w * 0.94, h * 0.72, BRANDS[2], 0.7); // rojo peq

  // Moteado/cráteres claros muy sutiles.
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 1 + Math.random() * 2.5;
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Mapa emisivo: pequeñas luces dispersas (sin patrón de bandas). */
function makeEmissiveTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff7e6';
  for (let i = 0; i < 130; i++) {
    ctx.globalAlpha = 0.25 + Math.random() * 0.55;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 2, 2);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Datos estáticos de un campo de cráteres distribuido sobre la esfera. */
interface Crater {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  scale: number;
}

export default function DegorgMoon({ onApproach, onHover }: PlanetProps) {
  const project = getProject('degorg-machines')!;
  const p = project.planet;
  const R = p.radius;
  const [hovered, setHovered] = useState(false);

  // --- Órbita alrededor de Intecpro ---
  const intec = getProject('intecpro')!.planet.position;
  const orbit = useRef<THREE.Group>(null);
  const ORBIT_R = 7;
  const RAISE = 1.2;

  // --- Refs tipados ---
  const moon = useRef<THREE.Group>(null);
  const surfaceMat = useRef<THREE.MeshStandardMaterial>(null);
  const gearRefs = useRef<(THREE.Mesh | null)[]>([]);
  const machineGroups = useRef<(THREE.Group | null)[]>([]);
  const satellites = useRef<THREE.Group>(null);
  const ringGroup = useRef<THREE.Group>(null);
  const rimMat = useRef<THREE.MeshBasicMaterial>(null);

  // --- Texturas (dispuestas al desmontar) ---
  const bandsTex = useMemo(() => makeBandsTexture(), []);
  const emissiveTex = useMemo(() => makeEmissiveTexture(), []);
  useEffect(() => () => bandsTex.dispose(), [bandsTex]);
  useEffect(() => () => emissiveTex.dispose(), [emissiveTex]);

  // --- Campo de cráteres (datos estáticos, calculados una vez) ---
  const craters = useMemo<Crater[]>(() => {
    const list: Crater[] = [];
    const count = 46;
    const up = new THREE.Vector3(0, 1, 0);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      // Distribución casi uniforme sobre la esfera (espiral de Fibonacci).
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const dir = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
      const pos = dir.clone().multiplyScalar(R * 1.001);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
      const s = 0.16 + ((i * 7.13) % 1) * 0.22;
      list.push({ pos, quat, scale: s });
    }
    return list;
  }, [R]);

  // --- Máquinas: una por sector, situada en el ecuador a su longitud central ---
  const machines = useMemo(
    () =>
      BRANDS.map((col, i) => {
        const ang = (i + 0.5) * (Math.PI / 2);
        return {
          color: col,
          x: Math.cos(ang) * (R + 0.02),
          z: Math.sin(ang) * (R + 0.02),
          rotY: Math.PI / 2 - ang,
        };
      }),
    [R],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Órbita lenta alrededor de Intecpro + giro de la luna sobre su eje.
    if (orbit.current) orbit.current.rotation.y += dt * 0.2;
    if (moon.current) moon.current.rotation.y += dt * (hovered ? 0.5 : 0.2);

    // Material de superficie: emisión latente que sube en hover.
    if (surfaceMat.current) {
      const target = hovered ? 0.9 : 0.18;
      surfaceMat.current.emissiveIntensity +=
        (target - surfaceMat.current.emissiveIntensity) * Math.min(1, dt * 6);
    }

    // Engranajes de las máquinas: giran (más rápido en hover).
    const gs = hovered ? 3.2 : 1.1;
    for (let i = 0; i < gearRefs.current.length; i++) {
      const g = gearRefs.current[i];
      if (g) g.rotation.z += dt * gs * (i % 2 ? 1 : -1);
    }
    // Ligero bombeo de las cajas-máquina en hover.
    for (let i = 0; i < machineGroups.current.length; i++) {
      const mg = machineGroups.current[i];
      if (!mg) continue;
      const pulse = hovered ? 1 + Math.sin(t * 5 + i) * 0.06 : 1;
      mg.scale.setScalar(0.5 * pulse);
    }

    // Satélites orbitando.
    if (satellites.current) satellites.current.rotation.y += dt * (hovered ? 1.1 : 0.6);

    // Anillo industrial: deriva lenta.
    if (ringGroup.current) ringGroup.current.rotation.z += dt * 0.12;

    // Rim glow respirando.
    if (rimMat.current) {
      rimMat.current.opacity = (hovered ? 0.32 : 0.16) + Math.sin(t * 1.4) * 0.04;
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
    <group ref={orbit} position={[intec[0], intec[1], intec[2]]}>
    <PlanetBody
      position={[ORBIT_R, RAISE, 0]}
      colliderRadius={R * 1.9}
      ringRadius={R * 1.25}
      accent={p.accent}
      label="degorg · machines"
      sublabel="Luna de Intecpro · 4 marcas"
      hovered={hovered}
      onOver={() => setHovered(true)}
      onOut={() => setHovered(false)}
      approach={payload}
      onHover={onHover}
      onClick={() => {
        const a = orbit.current ? orbit.current.rotation.y : 0;
        onApproach({
          ...payload,
          position: [
            intec[0] + Math.cos(a) * ORBIT_R,
            intec[1] + RAISE,
            intec[2] - Math.sin(a) * ORBIT_R,
          ],
        });
      }}
    >
      <group ref={moon}>
        {/* --- Superficie de 4 bandas de marca con separadores y remaches --- */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[R, 64, 64]} />
          <meshStandardMaterial
            ref={surfaceMat}
            map={bandsTex}
            emissive="#fff2d8"
            emissiveMap={emissiveTex}
            emissiveIntensity={0.15}
            roughness={0.72}
            metalness={0.15}
          />
        </mesh>

        {/* --- Campo de cráteres (muchos, instanciados a mano vía map ligero) --- */}
        <group>
          {craters.map((cr, i) => (
            <mesh
              key={`crater-${i}`}
              position={cr.pos}
              quaternion={cr.quat}
              scale={cr.scale}
            >
              <cylinderGeometry args={[0.85, 1, 0.35, 10, 1, true]} />
              <meshStandardMaterial
                color="#6b7488"
                roughness={0.9}
                metalness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>

        {/* --- Una máquina de marca por sector (caja + engranaje) --- */}
        {machines.map((m, i) => (
          <group
            key={`machine-${i}`}
            ref={(el) => {
              machineGroups.current[i] = el;
            }}
            position={[m.x, 0, m.z]}
            rotation={[0, m.rotY, 0]}
            scale={0.5}
          >
            {/* Caja base de la máquina */}
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.7, 0.5, 0.5]} />
              <meshStandardMaterial
                color="#20242f"
                metalness={0.85}
                roughness={0.35}
                emissive={m.color}
                emissiveIntensity={hovered ? 0.6 : 0.18}
              />
            </mesh>
            {/* Faldón emisivo con el color de marca */}
            <mesh position={[0, 0.42, 0.26]}>
              <boxGeometry args={[0.5, 0.12, 0.04]} />
              <meshBasicMaterial color={m.color} toneMapped={false} />
            </mesh>
            {/* Engranaje giratorio del color de marca */}
            <mesh
              position={[0, 0.5, 0]}
              ref={(el) => {
                gearRefs.current[i] = el;
              }}
            >
              <torusGeometry args={[0.22, 0.08, 6, 12]} />
              <meshStandardMaterial
                color={m.color}
                metalness={0.7}
                roughness={0.3}
                emissive={m.color}
                emissiveIntensity={hovered ? 0.9 : 0.3}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* --- Rim glow: esfera mayor con BackSide + AdditiveBlending --- */}
      <mesh>
        <sphereGeometry args={[R * 1.22, 32, 32]} />
        <meshBasicMaterial
          ref={rimMat}
          color="#cfd6ff"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* --- Anillo fino industrial (banda + costura interior) --- */}
      <group ref={ringGroup} rotation={[Math.PI * 0.5, 0.32, 0]}>
        <mesh>
          <torusGeometry args={[R * 1.45, 0.05, 10, 96]} />
          <meshStandardMaterial
            color="#5a6172"
            metalness={0.9}
            roughness={0.4}
            emissive="#9aa3bd"
            emissiveIntensity={hovered ? 0.5 : 0.2}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[R * 1.3, 0.012, 8, 96]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} toneMapped={false} />
        </mesh>
      </group>

      {/* --- Satélites diminutos orbitando --- */}
      <group ref={satellites}>
        <group position={[R * 1.7, 0.3, 0]}>
          <mesh>
            <tetrahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial
              color="#f97316"
              metalness={0.6}
              roughness={0.3}
              emissive="#f97316"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
        <group position={[-R * 1.55, -0.4, R * 0.6]}>
          <mesh>
            <icosahedronGeometry args={[0.13, 0]} />
            <meshStandardMaterial
              color="#2563eb"
              metalness={0.6}
              roughness={0.3}
              emissive="#2563eb"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      </group>

      {/* --- Polvo/chispas de acento alrededor de la luna --- */}
      <Sparkles
        count={hovered ? 40 : 18}
        scale={R * 3}
        size={hovered ? 4 : 2.2}
        speed={hovered ? 1.4 : 0.5}
        opacity={0.7}
        color="#f5f7ff"
      />
    </PlanetBody>
    </group>
  );
}
