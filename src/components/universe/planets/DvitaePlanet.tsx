import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import PlanetBody from '../PlanetBody';
import { getProject } from '../../../data/content';
import type { PlanetProps } from '../types';

/* Recreación fiel del cubo real de dvitae (www.dvitae.com):
 * cubo BLANCO + aristas gruesas ROJAS + circuitos rojos por cara con pulsos
 * que viajan y nodos que destellan. Paleta tomada del original. */
const C_BASE = '#aa182c'; // rojo base de aristas y trazas
const C_PULSE = '#e8304a'; // pulso que viaja
const C_NODE = '#ff6680'; // destello del nodo

// 3 filas de circuito por cara (coords normalizadas a la media-arista).
const ROWS = [
  { y: 0.52, x1: -0.95, x2: 0.2, nodeX: 0.2 },
  { y: 0.0, x1: -0.2, x2: 0.95, nodeX: -0.2 },
  { y: -0.52, x1: -0.95, x2: 0.95, nodeX: 0.4 },
];

// Rotación y eje exterior de cada una de las 6 caras (igual que el cubo real).
const FACE_ROT: [number, number, number][] = [
  [0, 0, 0],
  [0, Math.PI, 0],
  [0, -Math.PI / 2, 0],
  [0, Math.PI / 2, 0],
  [-Math.PI / 2, 0, -Math.PI / 2],
  [Math.PI / 2, 0, 0],
];
const FACE_AXIS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 1],
  [0, 0, -1],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
];

export default function DvitaePlanet({ onApproach, onHover }: PlanetProps) {
  const project = getProject('dvitae')!;
  const p = project.planet;
  const R = p.radius;
  const s = R * 1.45; // lado del cubo (mantiene la silueta)
  const H = s / 2;
  const T = s * 0.055; // grosor de las aristas
  const faceDist = H + s * 0.02;
  const lineThick = s * 0.05;
  const nodeR = s * 0.085;
  const [hovered, setHovered] = useState(false);

  const cube = useRef<THREE.Group>(null);
  const lineMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const nodeMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flow = useRef(0.45);

  // Materiales compartidos (una instancia, dispuestos al desmontar).
  const edgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_BASE,
        emissive: C_BASE,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.5,
        toneMapped: false,
      }),
    [],
  );
  const cubeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f5f6f8', metalness: 0.12, roughness: 0.55 }),
    [],
  );
  useEffect(
    () => () => {
      edgeMat.dispose();
      cubeMat.dispose();
    },
    [edgeMat, cubeMat],
  );

  const colBase = useMemo(() => new THREE.Color(C_BASE), []);
  const colNode = useMemo(() => new THREE.Color(C_NODE), []);

  // 12 aristas + 8 esquinas, como el cubo real.
  const edges = useMemo(() => {
    const list: { args: [number, number, number]; pos: [number, number, number] }[] = [];
    const add = (a: [number, number, number], x: number, y: number, z: number) =>
      list.push({ args: a, pos: [x, y, z] });
    for (const y of [-H, H]) for (const z of [-H, H]) add([s - T, T, T], 0, y, z);
    for (const x of [-H, H]) for (const z of [-H, H]) add([T, s - T, T], x, 0, z);
    for (const x of [-H, H]) for (const y of [-H, H]) add([T, T, s - T], x, y, 0);
    for (const x of [-H, H]) for (const y of [-H, H]) for (const z of [-H, H]) add([T, T, T], x, y, z);
    return list;
  }, [H, s, T]);

  // Datos de animación por fila (semillas deterministas, sin allocations/frame).
  const rowData = useMemo(() => {
    const out: { x1: number; x2: number; nodeX: number; speed: number; phase: number }[] = [];
    for (let f = 0; f < 6; f++) {
      for (let r = 0; r < ROWS.length; r++) {
        const mirror = f % 2 === 1 ? -1 : 1;
        const row = ROWS[r];
        out.push({
          x1: row.x1 * H * mirror,
          x2: row.x2 * H * mirror,
          nodeX: row.nodeX * H * mirror,
          speed: 0.1 + ((f * 3 + r) % 5) * 0.03,
          phase: ((f * 7 + r * 3) % 10) / 10,
        });
      }
    }
    return out;
  }, [H]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const hov = hovered ? 1 : 0;

    if (cube.current) {
      cube.current.rotation.x += dt * 0.15;
      cube.current.rotation.y += dt * 0.25;
    }

    // El hover sube el BRILLO (no la velocidad) del circuito.
    const targetFlow = hovered ? 1 : 0.4;
    flow.current += (targetFlow - flow.current) * Math.min(1, dt * 4);
    edgeMat.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.1 + hov * 0.6;

    const fw = 0.04 * H * H; // ancho del destello del nodo
    for (let i = 0; i < rowData.length; i++) {
      const d = rowData[i];
      // Velocidad de pulso lenta y constante (independiente del hover).
      const tt = (t * d.speed + d.phase) % 1;
      const posX = d.x1 + tt * (d.x2 - d.x1);

      const pulse = pulseRefs.current[i];
      if (pulse) pulse.position.x = posX;

      const lm = lineMats.current[i];
      if (lm) lm.emissiveIntensity = 0.5 + Math.sin(t * 3 + i) * 0.2 + flow.current * 0.8;

      const nm = nodeMats.current[i];
      if (nm) {
        const dist = posX - d.nodeX;
        const flash = Math.exp(-(dist * dist) / fw);
        nm.emissiveIntensity = 0.4 + flash * (1.6 + hov);
        nm.color.copy(colBase).lerp(colNode, flash);
        nm.emissive.copy(colBase).lerp(colNode, flash);
      }
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
      colliderRadius={R * 1.7}
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
      <group ref={cube}>
        {/* Cubo blanco */}
        <mesh material={cubeMat}>
          <boxGeometry args={[s, s, s]} />
        </mesh>

        {/* Aristas gruesas rojas */}
        {edges.map((e, i) => (
          <mesh key={`e${i}`} position={e.pos} material={edgeMat}>
            <boxGeometry args={e.args} />
          </mesh>
        ))}

        {/* Circuitos por cara: línea + nodo + pulso que viaja */}
        {FACE_ROT.map((rot, f) => {
          const ax = FACE_AXIS[f];
          const pos: [number, number, number] = [
            ax[0] * faceDist,
            ax[1] * faceDist,
            ax[2] * faceDist,
          ];
          return (
            <group key={`f${f}`} position={pos} rotation={rot}>
              {ROWS.map((row, r) => {
                const gi = f * ROWS.length + r;
                const d = rowData[gi];
                const mid = (d.x1 + d.x2) / 2;
                const len = Math.abs(d.x2 - d.x1);
                const y = row.y * H;
                return (
                  <group key={r}>
                    {/* Traza */}
                    <mesh position={[mid, y, 0.012 * s]}>
                      <boxGeometry args={[len, lineThick, 0.02 * s]} />
                      <meshStandardMaterial
                        ref={(el) => {
                          if (el) lineMats.current[gi] = el;
                        }}
                        color={C_BASE}
                        emissive={C_BASE}
                        emissiveIntensity={0.5}
                        toneMapped={false}
                      />
                    </mesh>
                    {/* Nodo / pad */}
                    <mesh position={[d.nodeX, y, 0.02 * s]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[nodeR, nodeR, 0.03 * s, 20]} />
                      <meshStandardMaterial
                        ref={(el) => {
                          if (el) nodeMats.current[gi] = el;
                        }}
                        color={C_BASE}
                        emissive={C_BASE}
                        emissiveIntensity={0.5}
                        toneMapped={false}
                      />
                    </mesh>
                    {/* Pulso que viaja */}
                    <mesh
                      ref={(el) => {
                        pulseRefs.current[gi] = el;
                      }}
                      position={[d.x1, y, 0.027 * s]}
                    >
                      <boxGeometry args={[0.1 * s, lineThick * 1.15, 0.025 * s]} />
                      <meshBasicMaterial
                        color={C_PULSE}
                        transparent
                        opacity={0.92}
                        toneMapped={false}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  </group>
                );
              })}
            </group>
          );
        })}
      </group>

      {/* Halo rojo para que destaque como planeta */}
      <mesh>
        <sphereGeometry args={[s * 0.95, 24, 24]} />
        <meshBasicMaterial
          color={C_BASE}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Partículas de "datos" */}
      <Sparkles
        count={hovered ? 40 : 18}
        scale={s * 1.9}
        size={hovered ? 4 : 2.5}
        speed={hovered ? 1.2 : 0.4}
        color={C_NODE}
        opacity={0.8}
      />
    </PlanetBody>
  );
}
