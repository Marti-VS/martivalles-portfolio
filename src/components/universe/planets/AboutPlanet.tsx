import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import PlanetBody from '../PlanetBody';
import { content } from '../../../data/content';
import type { PlanetProps } from '../types';

const UP = new THREE.Vector3(0, 1, 0);

/** Textura tipo planeta-Tierra: océanos, continentes verdes y casquetes. */
function makeTerrainTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  // Base: TIERRA verde (poco/ningún mar). Polos claros.
  const og = ctx.createLinearGradient(0, 0, 0, h);
  og.addColorStop(0, '#e7f1e2');
  og.addColorStop(0.1, '#74b257');
  og.addColorStop(0.5, '#4f9a3a');
  og.addColorStop(0.9, '#74b257');
  og.addColorStop(1, '#e7f1e2');
  ctx.fillStyle = og;
  ctx.fillRect(0, 0, w, h);

  // Parches de terreno (bosque, pradera, roca, arena) para dar variedad.
  const patches = ['#3f8f45', '#5aa84a', '#80bd63', '#9aa06a', '#6b7355'];
  const blob = (cx: number, cy: number, color: string, scale: number) => {
    let x = cx;
    let y = cy;
    const n = 10 + Math.floor(Math.random() * 8);
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const rr = (16 + Math.random() * 30) * scale;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
      x += (Math.random() - 0.5) * 60 * scale;
      y += (Math.random() - 0.5) * 40 * scale;
      y = Math.max(50, Math.min(h - 50, y));
      if (x < 0) x += w;
      if (x > w) x -= w;
    }
  };
  for (let i = 0; i < 14; i++) {
    blob(Math.random() * w, 60 + Math.random() * (h - 120), patches[i % patches.length], 0.6 + Math.random() * 0.8);
  }

  // Ríos sinuosos (azul) con orillas claras: el AGUA es río, no mar.
  const drawRiver = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    width: number,
    freq: number,
    amp: number,
    phase: number,
  ) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    const pts: [number, number][] = [];
    for (let s = 0; s <= 44; s++) {
      const t = s / 44;
      const off = Math.sin(t * Math.PI * freq + phase) * amp * (1 - Math.abs(t - 0.5));
      pts.push([x0 + dx * t + px * off, y0 + dy * t + py * off]);
    }
    const stroke = (color: string, wd: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = wd;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach((p, idx) => (idx ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.stroke();
    };
    stroke('rgba(190,180,120,0.4)', width + 8); // orillas
    stroke('#2c7fc0', width); // agua
    stroke('#8fcdf2', Math.max(1, width * 0.4)); // brillo
  };
  drawRiver(0, h * 0.35, w, h * 0.42, 9, 5, 26, 0.5);
  drawRiver(w * 0.2, 0, w * 0.35, h, 8, 4, 34, 1.4);
  drawRiver(w * 0.6, h, w * 0.78, 0, 7, 5, 30, 2.2);
  drawRiver(0, h * 0.7, w * 0.7, h * 0.62, 8, 6, 22, 0.2);
  drawRiver(w * 0.45, h * 0.2, w, h * 0.78, 7, 4, 28, 3.0);

  // Un par de lagos pequeños pintados (no discos 3D).
  for (let i = 0; i < 3; i++) {
    const lx = Math.random() * w;
    const ly = 90 + Math.random() * (h - 180);
    ctx.fillStyle = '#2c7fc0';
    ctx.beginPath();
    ctx.ellipse(lx, ly, 16 + Math.random() * 14, 10 + Math.random() * 8, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(143,205,242,0.7)';
    ctx.beginPath();
    ctx.ellipse(lx - 3, ly - 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Casquetes nevados en los polos.
  ctx.fillStyle = 'rgba(245,255,252,0.96)';
  ctx.fillRect(0, 0, w, h * 0.08);
  ctx.fillRect(0, h * 0.92, w, h * 0.08);
  ctx.fillStyle = 'rgba(245,255,252,0.4)';
  ctx.fillRect(0, h * 0.08, w, h * 0.035);
  ctx.fillRect(0, h * 0.885, w, h * 0.035);

  // Moteado sutil.
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Textura de nube cúmulo: varios "puffs" blandos formando una nube esponjosa. */
function makeCloudTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  const puff = (cx: number, cy: number, rr: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    g.addColorStop(0, 'rgba(255,255,255,0.92)');
    g.addColorStop(0.55, 'rgba(247,251,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.fill();
  };
  // Acumulamos puffs (base ancha y plana, cima abultada) con mezcla aditiva.
  ctx.globalCompositeOperation = 'lighter';
  const cy = h * 0.6;
  puff(w * 0.5, cy, 38);
  puff(w * 0.33, cy + 5, 30);
  puff(w * 0.67, cy + 3, 32);
  puff(w * 0.2, cy + 9, 22);
  puff(w * 0.8, cy + 9, 22);
  puff(w * 0.43, cy - 16, 27);
  puff(w * 0.6, cy - 14, 25);
  puff(w * 0.5, cy - 28, 19);
  ctx.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Textura de destello de sol (núcleo brillante + halo) para el hover. */
function makeSunTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,248,214,0.9)');
  g.addColorStop(0.6, 'rgba(255,226,140,0.25)');
  g.addColorStop(1, 'rgba(255,210,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface SubPeak {
  dx: number;
  dz: number;
  rs: number; // escala de radio respecto a la base principal
  hs: number; // escala de altura
}
interface PeakData {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  h: number;
  base: number;
  snow: number;
  color: string;
  tiltX: number;
  tiltZ: number;
  subs: SubPeak[];
  highest: boolean;
}
interface TreeData {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  s: number;
}
interface CloudData {
  axis: THREE.Vector3;
  phase: number;
  dist: number;
  scale: number;
}

const ROCKS = ['#6e6253', '#7d7264', '#5f5749', '#83786a'];
const TREE_GREEN = '#256b2f';

export default function AboutPlanet({ onApproach, onHover }: PlanetProps) {
  const ab = content.aboutPlanet;
  const r = ab.radius;
  const [hovered, setHovered] = useState(false);

  const spin = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Group>(null);
  const atmoMat = useRef<THREE.MeshBasicMaterial>(null);
  const rimMat = useRef<THREE.MeshBasicMaterial>(null);
  const sun = useRef<THREE.Sprite>(null);
  const sunMat = useRef<THREE.SpriteMaterial>(null);
  const flagPole = useRef<THREE.Group>(null);
  const cloudSprites = useRef<Array<THREE.Sprite | null>>([]);
  const auroraMat = useRef<THREE.MeshBasicMaterial>(null);

  const cloudSpeed = useRef(0.06);

  const terrainTex = useMemo(() => makeTerrainTexture(), []);
  const cloudTex = useMemo(() => makeCloudTexture(), []);
  const sunTex = useMemo(() => makeSunTexture(), []);
  useEffect(() => () => terrainTex.dispose(), [terrainTex]);
  useEffect(() => () => cloudTex.dispose(), [cloudTex]);
  useEffect(() => () => sunTex.dispose(), [sunTex]);

  const auroraColor = useMemo(() => new THREE.Color('#5fffc0'), []);
  const auroraAlt = useMemo(() => new THREE.Color('#6fb8ff'), []);

  // --- Relieve: montañas distribuidas de forma natural (Fibonacci) ---
  const peaks = useMemo<PeakData[]>(() => {
    const list: PeakData[] = [];
    const n = 18;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const nrm = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const c = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      if (y < -0.4 && i % 2 === 0) continue;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      nrm.set(Math.cos(theta) * rad, y, Math.sin(theta) * rad).normalize();
      q.setFromUnitVectors(UP, nrm);
      const rnd = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
      const base = 0.42 + rnd * 0.22; // bases anchas (macizos, no agujas)
      const h = 0.55 + rnd * 0.7; // altura moderada
      const snow = h > 0.95 ? 0.4 : h > 0.72 ? 0.28 : 0;
      const color = ROCKS[i % ROCKS.length];
      const tiltX = Math.sin(i * 3.1) * 0.1;
      const tiltZ = Math.cos(i * 2.3) * 0.1;
      // 2-3 subpicos para formar un macizo irregular.
      const subCount = i % 3 === 0 ? 3 : 2;
      const subs: SubPeak[] = [];
      for (let k = 0; k < subCount; k++) {
        const a = i * 1.7 + k * 2.4;
        const dist = base * (0.85 + k * 0.32);
        subs.push({ dx: Math.cos(a) * dist, dz: Math.sin(a) * dist, rs: 0.62 - k * 0.13, hs: 0.64 - k * 0.16 });
      }
      c.copy(nrm).multiplyScalar(r + h / 2 - 0.12);
      list.push({
        position: [c.x, c.y, c.z],
        quaternion: [q.x, q.y, q.z, q.w],
        h,
        base,
        snow,
        color,
        tiltX,
        tiltZ,
        subs,
        highest: false,
      });
    }
    let maxIdx = 0;
    for (let i = 1; i < list.length; i++) if (list[i].h > list[maxIdx].h) maxIdx = i;
    list[maxIdx].highest = true;
    return list;
  }, [r]);

  const flag = useMemo(() => {
    const top = peaks.find((p) => p.highest)!;
    const nrm = new THREE.Vector3(...top.position).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, nrm);
    const c = nrm.clone().multiplyScalar(r + top.h - 0.02);
    return {
      position: [c.x, c.y, c.z] as [number, number, number],
      quaternion: [q.x, q.y, q.z, q.w] as [number, number, number, number],
    };
  }, [peaks, r]);

  const trees = useMemo<TreeData[]>(() => {
    const list: TreeData[] = [];
    const n = 100;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const nrm = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const c = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      if (Math.abs(y) > 0.72) continue;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i * 1.3;
      nrm.set(Math.cos(theta) * rad, y, Math.sin(theta) * rad).normalize();
      q.setFromUnitVectors(UP, nrm);
      const s = 0.7 + ((i * 5) % 4) * 0.18;
      c.copy(nrm).multiplyScalar(r + 0.04);
      list.push({ position: [c.x, c.y, c.z], quaternion: [q.x, q.y, q.z, q.w], s });
    }
    return list;
  }, [r]);

  const cloudData = useMemo<CloudData[]>(() => {
    const list: CloudData[] = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const tilt = (i / n) * Math.PI * 0.6 - 0.3;
      const axis = new THREE.Vector3(Math.sin(tilt), Math.cos(tilt) * 0.6 + 0.4, Math.cos(i * 1.3)).normalize();
      list.push({
        axis,
        phase: (i / n) * Math.PI * 2,
        dist: r * 1.28 + (i % 4) * 0.16,
        scale: 0.95 + (i % 4) * 0.3,
      });
    }
    return list;
  }, [r]);

  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (spin.current) spin.current.rotation.y += dt * 0.1;

    if (atmoMat.current) {
      const target = hovered ? 0.5 : 0.28;
      atmoMat.current.opacity += (target - atmoMat.current.opacity) * Math.min(1, dt * 4);
    }
    if (rimMat.current) {
      const pulse = 0.5 + Math.sin(t * 1.4) * 0.06;
      const target = (hovered ? 0.85 : 0.5) * pulse + 0.1;
      rimMat.current.opacity += (target - rimMat.current.opacity) * Math.min(1, dt * 4);
    }
    if (auroraMat.current) {
      const k = 0.5 + 0.5 * Math.sin(t * 0.8);
      auroraMat.current.color.copy(auroraColor).lerp(auroraAlt, k);
      auroraMat.current.opacity = (hovered ? 0.55 : 0.32) + Math.sin(t * 2) * 0.08;
    }

    const speedTarget = hovered ? 0.2 : 0.06;
    cloudSpeed.current += (speedTarget - cloudSpeed.current) * Math.min(1, dt * 3);
    const distMul = hovered ? 1.12 : 1.0;
    if (clouds.current) {
      const sprites = cloudSprites.current;
      for (let i = 0; i < cloudData.length; i++) {
        const cd = cloudData[i];
        const s = sprites[i];
        if (!s) continue;
        const ang = cd.phase + t * cloudSpeed.current * (1 + (i % 2) * 0.3);
        tmpQuat.setFromAxisAngle(cd.axis, ang);
        tmpVec.set(1, 0, 0).applyQuaternion(tmpQuat);
        tmpVec.addScaledVector(cd.axis, -tmpVec.dot(cd.axis)).normalize();
        const d = cd.dist * distMul;
        s.position.set(tmpVec.x * d, tmpVec.y * d, tmpVec.z * d);
        const bob = 1 + Math.sin(t * 0.8 + cd.phase) * 0.06;
        s.scale.set(cd.scale * 1.9 * bob, cd.scale * 0.95 * bob, 1);
      }
    }

    if (sunMat.current) {
      const target = hovered ? 0.95 : 0;
      sunMat.current.opacity += (target - sunMat.current.opacity) * Math.min(1, dt * 5);
    }
    if (sun.current) {
      const flicker = 1 + Math.sin(t * 3) * 0.05;
      const base = hovered ? 1 : 0.5;
      sun.current.scale.setScalar(r * 1.1 * base * flicker);
    }

    if (flagPole.current) flagPole.current.rotation.z = Math.sin(t * 2.2) * 0.12;
  });

  const payload = {
    id: ab.kind,
    position: ab.position,
    radius: ab.radius,
    label: ab.label,
    sublabel: content.about.heading,
    url: null,
    project: null,
  };

  return (
    <PlanetBody
      position={ab.position}
      colliderRadius={r * 1.6}
      ringRadius={r * 1.12}
      accent={ab.accent}
      label={ab.label}
      sublabel="Sobre mí · montañas"
      hovered={hovered}
      onOver={() => setHovered(true)}
      onOut={() => setHovered(false)}
      approach={payload}
      onHover={onHover}
      onClick={() => onApproach(payload)}
    >
      {/* === GLOBO + RELIEVE (rota suave) === */}
      <group ref={spin}>
        {/* Globo con textura de océanos y continentes */}
        <mesh>
          <sphereGeometry args={[r, 64, 64]} />
          <meshStandardMaterial map={terrainTex} roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Montañas: macizos con subpicos, facetas rocosas y nieve */}
        {peaks.map((m, i) => (
          <group key={`pk-${i}`} position={m.position} quaternion={m.quaternion}>
            <group rotation={[m.tiltX, 0, m.tiltZ]}>
              {/* Pico principal */}
              <mesh>
                <coneGeometry args={[m.base, m.h, 5]} />
                <meshStandardMaterial color={m.color} roughness={1} flatShading />
              </mesh>
              {m.snow > 0 && (
                <mesh position={[0, m.h * (0.5 - m.snow * 0.5), 0]}>
                  <coneGeometry args={[m.base * (m.snow + 0.06), m.h * m.snow, 5]} />
                  <meshStandardMaterial color="#f4fbff" roughness={1} flatShading />
                </mesh>
              )}
              {/* Subpicos del macizo */}
              {m.subs.map((s, k) => {
                const sb = m.base * s.rs;
                const sh = m.h * s.hs;
                return (
                  <group key={k} position={[s.dx, -m.h / 2 + sh / 2, s.dz]}>
                    <mesh>
                      <coneGeometry args={[sb, sh, 5]} />
                      <meshStandardMaterial color={m.color} roughness={1} flatShading />
                    </mesh>
                    {m.snow > 0 && (
                      <mesh position={[0, sh * 0.3, 0]}>
                        <coneGeometry args={[sb * 0.45, sh * 0.4, 5]} />
                        <meshStandardMaterial color="#f4fbff" roughness={1} flatShading />
                      </mesh>
                    )}
                  </group>
                );
              })}
            </group>
          </group>
        ))}

        {/* Bosque instanciado */}
        <Instances limit={trees.length} range={trees.length}>
          <coneGeometry args={[0.14, 0.42, 5]} />
          <meshStandardMaterial color={TREE_GREEN} roughness={1} flatShading />
          {trees.map((tr, i) => (
            <Instance key={`tree-${i}`} position={tr.position} quaternion={tr.quaternion} scale={tr.s} />
          ))}
        </Instances>

        {/* Banderita de senderismo */}
        <group position={flag.position} quaternion={flag.quaternion}>
          <group ref={flagPole}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
              <meshStandardMaterial color="#caa472" roughness={0.8} />
            </mesh>
            <mesh position={[0.18, 0.48, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.12, 0.32, 3]} />
              <meshStandardMaterial
                color="#e2483a"
                emissive="#e2483a"
                emissiveIntensity={0.25}
                roughness={0.7}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* === Aurora sobre el polo norte === */}
      <mesh position={[0, r * 0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.5, 0.1, 12, 64]} />
        <meshBasicMaterial
          ref={auroraMat}
          color="#5fffc0"
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* === Nubes orbitando === */}
      <group ref={clouds}>
        {cloudData.map((_cd, i) => (
          <sprite
            key={`cloud-${i}`}
            ref={(s) => {
              cloudSprites.current[i] = s;
            }}
          >
            <spriteMaterial map={cloudTex} transparent opacity={0.85} depthWrite={false} />
          </sprite>
        ))}
      </group>

      {/* === Destello de sol (hover) === */}
      <sprite ref={sun} position={[r * 1.4, r * 0.9, r * 0.6]}>
        <spriteMaterial
          ref={sunMat}
          map={sunTex}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* === Atmósfera === */}
      <mesh>
        <sphereGeometry args={[r * 1.14, 32, 32]} />
        <meshBasicMaterial
          ref={atmoMat}
          color="#9be7c8"
          transparent
          opacity={0.28}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[r * 1.32, 32, 32]} />
        <meshBasicMaterial
          ref={rimMat}
          color="#6fe3d2"
          transparent
          opacity={0.4}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <Sparkles count={40} scale={r * 3} size={2.2} speed={0.3} opacity={0.55} color={ab.accent} />
    </PlanetBody>
  );
}
