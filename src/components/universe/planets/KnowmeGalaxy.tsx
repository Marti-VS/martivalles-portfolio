import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import PlanetBody from '../PlanetBody';
import { getProject } from '../../../data/content';
import type { PlanetProps } from '../types';

export default function KnowmeGalaxy({ onApproach, onHover }: PlanetProps) {
  const project = getProject('knowme')!;
  const p = project.planet;
  const R = p.radius;
  const [hovered, setHovered] = useState(false);

  /* ------------------------------------------------------------------ refs */
  const galaxy = useRef<THREE.Group>(null);
  const armsGroup = useRef<THREE.Group>(null);
  const counterGroup = useRef<THREE.Group>(null);
  const armsMat = useRef<THREE.PointsMaterial>(null);
  const counterMat = useRef<THREE.PointsMaterial>(null);
  const heroMat = useRef<THREE.PointsMaterial>(null);

  const coreInner = useRef<THREE.MeshBasicMaterial>(null);
  const coreMid = useRef<THREE.MeshBasicMaterial>(null);
  const coreOuter = useRef<THREE.MeshBasicMaterial>(null);
  const coreGroup = useRef<THREE.Group>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const rimMat = useRef<THREE.MeshBasicMaterial>(null);

  /* --------------------------------------------------- colores reutilizados */
  const palette = useMemo(
    () => ({
      violet: new THREE.Color('#8b5cf6'),
      magenta: new THREE.Color('#e853c9'),
      cyan: new THREE.Color('#38e8ff'),
      hot: new THREE.Color('#fff0ff'),
    }),
    [],
  );

  /* ------------------------------------------------ brazos espirales (main) */
  const main = useMemo(() => {
    const N = 3200;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const arms = 3;
    const maxR = R * 2.4;
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      // densidad mayor hacia el centro
      const t = Math.pow(Math.random(), 0.6);
      const radius = t * maxR;
      const arm = ((i % arms) / arms) * Math.PI * 2;
      // giro logarítmico de los brazos
      const branchAngle = arm + radius * 0.62;
      // dispersión que cae con el radio -> brazos finos y definidos
      const spread = (Math.pow(Math.random(), 2.5) - 0.5) * (0.55 + (1 - t) * 1.1);
      const sx = (Math.random() - 0.5) * spread;
      const sz = (Math.random() - 0.5) * spread;
      const x = Math.cos(branchAngle) * radius + sx;
      const z = Math.sin(branchAngle) * radius + sz;
      const y = (Math.random() - 0.5) * (0.18 + (1 - t) * 0.9) * R * 0.35;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // gradiente violeta -> magenta -> cian hacia fuera, núcleo casi blanco
      if (t < 0.16) {
        tmp.copy(palette.hot).lerp(palette.violet, t / 0.16);
      } else if (t < 0.6) {
        tmp.copy(palette.violet).lerp(palette.magenta, (t - 0.16) / 0.44);
      } else {
        tmp.copy(palette.magenta).lerp(palette.cyan, (t - 0.6) / 0.4);
      }
      // brillo variable
      const b = 0.7 + Math.random() * 0.5;
      col[i * 3] = Math.min(1, tmp.r * b);
      col[i * 3 + 1] = Math.min(1, tmp.g * b);
      col[i * 3 + 2] = Math.min(1, tmp.b * b);
    }
    return { positions: pos, colors: col };
  }, [R, palette]);

  /* ------------------------------- segunda capa contrarrotante (profundidad) */
  const counter = useMemo(() => {
    const N = 1100;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const arms = 3;
    const maxR = R * 2.55;
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const t = Math.pow(Math.random(), 0.8);
      const radius = t * maxR;
      const arm = ((i % arms) / arms) * Math.PI * 2 + 0.9;
      const branchAngle = arm - radius * 0.52;
      const spread = (Math.random() - 0.5) * (0.9 + (1 - t) * 1.4);
      const x = Math.cos(branchAngle) * radius + spread;
      const z = Math.sin(branchAngle) * radius + spread;
      const y = (Math.random() - 0.5) * R * 0.5;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      tmp.copy(palette.violet).lerp(palette.cyan, t);
      const b = 0.4 + Math.random() * 0.35;
      col[i * 3] = tmp.r * b;
      col[i * 3 + 1] = tmp.g * b;
      col[i * 3 + 2] = tmp.b * b;
    }
    return { positions: pos, colors: col };
  }, [R, palette]);

  /* ----------------------------------------- estrellas héroe (más grandes) */
  const hero = useMemo(() => {
    const N = 28;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const arms = 3;
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const t = 0.25 + Math.random() * 0.7;
      const radius = t * R * 2.2;
      const arm = ((i % arms) / arms) * Math.PI * 2;
      const branchAngle = arm + radius * 0.62;
      pos[i * 3] = Math.cos(branchAngle) * radius + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * R * 0.2;
      pos[i * 3 + 2] = Math.sin(branchAngle) * radius + (Math.random() - 0.5) * 0.4;
      tmp.copy(palette.magenta).lerp(palette.cyan, Math.random());
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
    }
    return { positions: pos, colors: col };
  }, [R, palette]);

  /* ----------------------------- textura radial del halo/disco (CanvasTex) */
  const haloTex = useMemo(() => {
    const size = 256;
    const cv = document.createElement('canvas');
    cv.width = size;
    cv.height = size;
    const ctx = cv.getContext('2d')!;
    const cx = size / 2;
    const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0.0, 'rgba(255,235,255,0.9)');
    g.addColorStop(0.18, 'rgba(180,120,255,0.55)');
    g.addColorStop(0.45, 'rgba(150,60,210,0.28)');
    g.addColorStop(0.72, 'rgba(80,40,160,0.12)');
    g.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // carriles de polvo oscuros en espiral
    ctx.globalCompositeOperation = 'destination-out';
    const arms = 3;
    for (let a = 0; a < arms; a++) {
      ctx.beginPath();
      const base = (a / arms) * Math.PI * 2 + 0.4;
      for (let s = 0; s <= 60; s++) {
        const tt = s / 60;
        const rad = tt * cx * 0.95;
        const ang = base + tt * 4.2;
        const x = cx + Math.cos(ang) * rad;
        const y = cx + Math.sin(ang) * rad;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);

  useEffect(() => () => haloTex.dispose(), [haloTex]);

  /* ------------------------------------------------------------- animación */
  const tHover = useRef(0);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = hovered ? 1 : 0;
    tHover.current += (target - tHover.current) * Math.min(1, dt * 6);
    const h = tHover.current;
    const tm = state.clock.elapsedTime;

    if (galaxy.current) {
      galaxy.current.rotation.y += dt * (0.05 + h * 0.06);
    }
    if (armsGroup.current) {
      armsGroup.current.rotation.y += dt * (0.1 + h * 0.28);
    }
    if (counterGroup.current) {
      counterGroup.current.rotation.y -= dt * (0.06 + h * 0.12);
    }

    // tamaño/brillo de las estrellas reaccionan al hover
    if (armsMat.current) {
      armsMat.current.size = (0.11 + h * 0.07) + Math.sin(tm * 1.4) * 0.004;
      armsMat.current.opacity = 0.85 + h * 0.15;
    }
    if (counterMat.current) {
      counterMat.current.size = 0.08 + h * 0.04;
    }
    if (heroMat.current) {
      heroMat.current.size = (0.32 + h * 0.22) + Math.sin(tm * 3) * 0.03;
    }

    // núcleo pulsante multicapa (bloom falso)
    const pulse = 0.5 + Math.sin(tm * 2.2) * 0.5;
    if (coreInner.current) coreInner.current.opacity = 0.85 + pulse * 0.15 + h * 0.1;
    if (coreMid.current) coreMid.current.opacity = 0.4 + pulse * 0.25 + h * 0.25;
    if (coreOuter.current) coreOuter.current.opacity = 0.15 + pulse * 0.18 + h * 0.28;
    if (coreGroup.current) {
      const s = 1 + pulse * 0.06 + h * 0.18;
      coreGroup.current.scale.setScalar(s);
    }
    if (haloMat.current) {
      haloMat.current.opacity = 0.55 + pulse * 0.1 + h * 0.25;
    }
    if (rimMat.current) {
      rimMat.current.opacity = 0.18 + pulse * 0.06 + h * 0.22;
    }
  });

  /* -------------------------------------------------------------- payload */
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
      colliderRadius={R * 2.7}
      ringRadius={R * 1.9}
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
      <group ref={galaxy} rotation={[Math.PI * 0.16, 0, Math.PI * 0.06]}>
        {/* Disco/halo de polvo: plano grande additive mirando al disco */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[R * 6.2, R * 6.2]} />
          <meshBasicMaterial
            ref={haloMat}
            map={haloTex}
            color="#d9a8ff"
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {/* Brazos espirales principales */}
        <group ref={armsGroup}>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[main.positions, 3]} />
              <bufferAttribute attach="attributes-color" args={[main.colors, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={armsMat}
              size={0.11}
              vertexColors
              transparent
              opacity={0.9}
              sizeAttenuation
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </points>

          {/* Estrellas héroe más grandes y brillantes */}
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[hero.positions, 3]} />
              <bufferAttribute attach="attributes-color" args={[hero.colors, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={heroMat}
              size={0.34}
              vertexColors
              transparent
              opacity={1}
              sizeAttenuation
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </points>
        </group>

        {/* Segunda capa contrarrotante (profundidad) */}
        <group ref={counterGroup}>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[counter.positions, 3]} />
              <bufferAttribute attach="attributes-color" args={[counter.colors, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={counterMat}
              size={0.08}
              vertexColors
              transparent
              opacity={0.6}
              sizeAttenuation
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </points>
        </group>

        {/* Núcleo brillante multicapa (bloom falso) */}
        <group ref={coreGroup}>
          <mesh>
            <sphereGeometry args={[R * 0.3, 24, 24]} />
            <meshBasicMaterial
              ref={coreInner}
              color="#fff2ff"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[R * 0.55, 24, 24]} />
            <meshBasicMaterial
              ref={coreMid}
              color="#e879f9"
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[R * 0.95, 20, 20]} />
            <meshBasicMaterial
              ref={coreOuter}
              color="#a855f7"
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      {/* Rim glow global (esfera mayor BackSide additive) */}
      <mesh>
        <sphereGeometry args={[R * 1.7, 24, 24]} />
        <meshBasicMaterial
          ref={rimMat}
          color="#c084fc"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Partículas de acento que POPEAN en hover */}
      <Sparkles
        count={hovered ? 90 : 30}
        scale={[R * 5, R * 1.6, R * 5]}
        size={hovered ? 8 : 3.5}
        speed={hovered ? 1.8 : 0.45}
        opacity={0.9}
        color="#f5c6ff"
      />

      {/* Billboard de destello central que siempre mira a la cámara */}
      <Billboard>
        <mesh>
          <circleGeometry args={[R * 0.7, 32]} />
          <meshBasicMaterial
            map={haloTex}
            color="#ffe9ff"
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
    </PlanetBody>
  );
}
