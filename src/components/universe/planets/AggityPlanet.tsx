import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import PlanetBody from '../PlanetBody';
import { getProject } from '../../../data/content';
import type { PlanetProps } from '../types';

/** Nº de arcos eléctricos que saltan de la superficie. */
const ARC_COUNT = 6;
/** Nº de segmentos (vértices) por arco. */
const ARC_SEGMENTS = 14;

/** Datos estáticos de un arco: anclas en el núcleo y semillas de ruido. */
interface ArcSpec {
  /** Punto de salida en la superficie (unitario, se escala por radio). */
  start: THREE.Vector3;
  /** Punto de llegada en la superficie (unitario). */
  end: THREE.Vector3;
  /** Desfase temporal para que cada arco viva por su cuenta. */
  phase: number;
  /** Frecuencia de parpadeo de visibilidad. */
  blink: number;
  /** Ejes laterales para el zigzag (ortonormales al eje start→end). */
  side: THREE.Vector3;
  up: THREE.Vector3;
}

export default function AggityPlanet({ onApproach, onHover }: PlanetProps) {
  const project = getProject('aggity')!;
  const p = project.planet;
  const R = p.radius;
  const [hovered, setHovered] = useState(false);

  // --- Refs tipados ---------------------------------------------------------
  const coreRef = useRef<THREE.Mesh>(null);
  const distortRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const gridRef = useRef<THREE.LineSegments>(null);
  const gyro1 = useRef<THREE.Group>(null);
  const gyro2 = useRef<THREE.Group>(null);
  const gyro3 = useRef<THREE.Group>(null);
  const arcGroup = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // --- Colores reutilizables (sin allocations por frame) --------------------
  const colCore = useMemo(() => new THREE.Color(p.color), [p.color]);
  const colAccent = useMemo(() => new THREE.Color(p.accent), [p.accent]);

  // --- Especificaciones estáticas de los arcos ------------------------------
  const arcs = useMemo<ArcSpec[]>(() => {
    const list: ArcSpec[] = [];
    const axis = new THREE.Vector3();
    const ref = new THREE.Vector3();
    for (let i = 0; i < ARC_COUNT; i++) {
      const a1 = (i / ARC_COUNT) * Math.PI * 2;
      const a2 = a1 + 1.4 + (i % 3) * 0.5;
      const y1 = Math.sin(i * 1.7) * 0.7;
      const y2 = Math.sin(i * 2.3 + 1) * 0.7;
      const r1 = Math.sqrt(Math.max(0, 1 - y1 * y1));
      const r2 = Math.sqrt(Math.max(0, 1 - y2 * y2));
      const start = new THREE.Vector3(Math.cos(a1) * r1, y1, Math.sin(a1) * r1).normalize();
      const end = new THREE.Vector3(Math.cos(a2) * r2, y2, Math.sin(a2) * r2).normalize();
      // Base ortonormal para el zigzag lateral.
      axis.subVectors(end, start).normalize();
      ref.set(0, 1, 0);
      if (Math.abs(axis.dot(ref)) > 0.9) ref.set(1, 0, 0);
      const side = new THREE.Vector3().crossVectors(axis, ref).normalize();
      const up = new THREE.Vector3().crossVectors(axis, side).normalize();
      list.push({ start, end, phase: i * 1.31, blink: 9 + i * 1.7, side, up });
    }
    return list;
  }, []);

  // --- Objetos Line de los arcos (geometría + material reutilizables) -------
  // Construimos los THREE.Line a mano para evitar el choque del intrínseco
  // <line> de R3F con el SVGLineElement del DOM, y para mutar el buffer de
  // posiciones por frame sin recrear nada.
  const arcObjects = useMemo(() => {
    return arcs.map((_, i) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3));
      const m = new THREE.LineBasicMaterial({
        color: new THREE.Color(p.accent),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const line = new THREE.Line(g, m);
      line.frustumCulled = false;
      void i;
      return { line, geom: g, mat: m };
    });
  }, [arcs, p.accent]);

  useEffect(() => {
    const objs = arcObjects;
    return () => {
      for (const o of objs) {
        o.geom.dispose();
        o.mat.dispose();
      }
    };
  }, [arcObjects]);

  // Scratch reutilizable para calcular posiciones de arco sin allocations.
  const scratch = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), point: new THREE.Vector3() }),
    [],
  );

  // --- Geometría de rejilla icosaédrica como wireframe limpio ---------------
  const gridGeom = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(R * 1.14, 1);
    const wire = new THREE.WireframeGeometry(base);
    base.dispose();
    return wire;
  }, [R]);

  useEffect(() => {
    const g = gridGeom;
    return () => g.dispose();
  }, [gridGeom]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const h = hovered ? 1 : 0;

    // Núcleo: rotación lenta + pulso emisivo entre color y acento.
    if (coreRef.current) coreRef.current.rotation.y += dt * 0.18;
    if (distortRef.current) {
      const pulse = 0.5 + Math.sin(t * 2.4) * 0.5; // 0..1
      distortRef.current.emissive.copy(colCore).lerp(colAccent, pulse);
      distortRef.current.emissiveIntensity = 0.55 + pulse * 0.7 + h * 0.8;
    }

    // Rejilla tecnológica: giro contrario suave.
    if (gridRef.current) {
      gridRef.current.rotation.y -= dt * 0.25;
      gridRef.current.rotation.x += dt * 0.1;
    }

    // Giroscopio: tres anillos en ejes distintos, aceleran en hover.
    const spin = 1 + h * 1.6;
    if (gyro1.current) gyro1.current.rotation.z += dt * 0.7 * spin;
    if (gyro2.current) {
      gyro2.current.rotation.x += dt * 0.9 * spin;
      gyro2.current.rotation.y += dt * 0.4 * spin;
    }
    if (gyro3.current) {
      gyro3.current.rotation.y -= dt * 0.6 * spin;
      gyro3.current.rotation.z += dt * 0.35 * spin;
    }

    // Arcos eléctricos: mutamos los buffers existentes (sin crear arrays).
    const surf = R * 1.0;
    for (let i = 0; i < arcs.length; i++) {
      const spec = arcs[i];
      const { geom, mat } = arcObjects[i];
      const pos = geom.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;

      scratch.a.copy(spec.start).multiplyScalar(surf);
      scratch.b.copy(spec.end).multiplyScalar(surf);

      const amp = (0.28 + h * 0.22) * R;
      for (let s = 0; s < ARC_SEGMENTS; s++) {
        const k = s / (ARC_SEGMENTS - 1);
        // Interpolación lineal base.
        scratch.point.copy(scratch.a).lerp(scratch.b, k);
        // Arco hacia fuera (combadura) para que salte por encima de la superficie.
        const bow = Math.sin(k * Math.PI) * R * 0.5;
        scratch.point.addScaledVector(spec.start, bow * 0.5);
        scratch.point.addScaledVector(spec.end, bow * 0.5);
        // Zigzag eléctrico que tiembla por frame.
        const env = Math.sin(k * Math.PI); // 0 en extremos, 1 en medio
        const jx =
          Math.sin(t * 27 + spec.phase + s * 1.7) * amp * env +
          Math.sin(t * 53 + s * 0.9) * amp * 0.4 * env;
        const jy =
          Math.cos(t * 31 + spec.phase + s * 2.1) * amp * env +
          Math.cos(t * 61 + s * 1.3) * amp * 0.4 * env;
        scratch.point.addScaledVector(spec.side, jx);
        scratch.point.addScaledVector(spec.up, jy);

        const o = s * 3;
        arr[o] = scratch.point.x;
        arr[o + 1] = scratch.point.y;
        arr[o + 2] = scratch.point.z;
      }
      pos.needsUpdate = true;
      geom.computeBoundingSphere();

      // Parpadeo de visibilidad: el arco aparece y desaparece como descarga.
      const flick = Math.sin(t * spec.blink + spec.phase) * Math.sin(t * 3.7 + i);
      const on = flick > (hovered ? 0.05 : 0.45) ? 1 : 0;
      mat.opacity = on * (0.7 + h * 0.3);
    }

    // Luz que parpadea como una descarga eléctrica.
    if (lightRef.current) {
      const spike = Math.sin(t * 33) * Math.sin(t * 19.7) > 0.55 ? 1 : 0;
      lightRef.current.intensity = (hovered ? 3.5 : 1.4) + spike * (hovered ? 11 : 6);
    }

    // Halo de atmósfera: respira ligeramente.
    if (haloRef.current) {
      const s = 1 + Math.sin(t * 1.6) * 0.02 + h * 0.04;
      haloRef.current.scale.setScalar(s);
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
      colliderRadius={R * 1.75}
      ringRadius={R * 1.2}
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
      {/* NÚCLEO de energía pulsante (azul aggity → cian) */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[R, 12]} />
        <MeshDistortMaterial
          ref={(el) => {
            distortRef.current = el as unknown as THREE.MeshStandardMaterial | null;
          }}
          color={p.color}
          metalness={0.65}
          roughness={0.2}
          emissive={p.accent}
          emissiveIntensity={0.6}
          distort={hovered ? 0.45 : 0.3}
          speed={hovered ? 3.5 : 2}
          toneMapped={false}
        />
      </mesh>

      {/* Capa interna brillante para que el núcleo "queme" desde dentro */}
      <mesh scale={0.92}>
        <sphereGeometry args={[R, 24, 24]} />
        <meshBasicMaterial
          color={p.accent}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Rejilla tecnológica hexagonal/icosaédrica emisiva (wireframe) */}
      <lineSegments ref={gridRef} geometry={gridGeom}>
        <lineBasicMaterial
          color={p.accent}
          transparent
          opacity={hovered ? 0.6 : 0.38}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* GIROSCOPIO: tres anillos en ejes distintos */}
      <group ref={gyro1} rotation={[Math.PI * 0.5, 0, 0]}>
        <mesh>
          <torusGeometry args={[R * 1.4, 0.045, 12, 96]} />
          <meshBasicMaterial color={p.accent} toneMapped={false} transparent opacity={0.85} />
        </mesh>
      </group>
      <group ref={gyro2} rotation={[0, 0, Math.PI * 0.35]}>
        <mesh>
          <torusGeometry args={[R * 1.55, 0.035, 12, 96]} />
          <meshBasicMaterial color={p.color} toneMapped={false} transparent opacity={0.7} />
        </mesh>
      </group>
      <group ref={gyro3} rotation={[Math.PI * 0.28, Math.PI * 0.5, 0]}>
        <mesh>
          <torusGeometry args={[R * 1.68, 0.03, 10, 96]} />
          <meshBasicMaterial color={p.accent} toneMapped={false} transparent opacity={0.55} />
        </mesh>
      </group>

      {/* ARCOS ELÉCTRICOS: líneas con buffers mutados por frame */}
      <group ref={arcGroup}>
        {arcObjects.map((o, i) => (
          <primitive key={i} object={o.line} />
        ))}
      </group>

      {/* Atmósfera / rim glow (esfera mayor, BackSide + Additive) */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[R * 1.32, 32, 32]} />
        <meshBasicMaterial
          color={p.accent}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Chispas densas de energía */}
      <Sparkles
        count={hovered ? 120 : 60}
        scale={R * 3.2}
        size={hovered ? 7 : 3.5}
        speed={hovered ? 2.8 : 1.2}
        opacity={0.9}
        color={p.accent}
      />

      {/* Luz de descarga eléctrica */}
      <pointLight ref={lightRef} color={p.accent} intensity={1.4} distance={R * 7} decay={2} />
    </PlanetBody>
  );
}
