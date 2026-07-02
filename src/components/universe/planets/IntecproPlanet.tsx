import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PlanetBody from '../PlanetBody';
import { getProject } from '../../../data/content';
import type { PlanetProps } from '../types';

const UP = new THREE.Vector3(0, 1, 0);

/* Chapa industrial clara (para que el naranja del material se vea vivo). */
function makePlateTexture(): THREE.CanvasTexture {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, '#eceff4');
  g.addColorStop(0.5, '#dadee6');
  g.addColorStop(1, '#c6ccd6');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const cell = 64;
  ctx.lineWidth = 2;
  for (let gx = 0; gx < s; gx += cell) {
    for (let gy = 0; gy < s; gy += cell) {
      const r = Math.random();
      if (r < 0.3) {
        ctx.fillStyle = 'rgba(120,126,140,0.22)';
        ctx.fillRect(gx + 5, gy + 5, cell - 10, cell - 10);
      } else if (r < 0.48) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(gx + 5, gy + 5, cell - 10, cell - 10);
      }
      ctx.strokeStyle = 'rgba(60,64,74,0.4)';
      ctx.strokeRect(gx + 3, gy + 3, cell - 6, cell - 6);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = 4;
  return tex;
}

/* Cinta transportadora: tacos sobre goma oscura. */
function makeBeltTexture(): THREE.CanvasTexture {
  const w = 64;
  const h = 32;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#22252d';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3a3f4a';
  for (let x = 0; x < w; x += 10) ctx.fillRect(x, 0, 4, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Geometría de engranaje (cog con dientes y agujero), compartida por todos. */
function makeGearGeometry(): THREE.ExtrudeGeometry {
  const teeth = 10;
  const outer = 0.5;
  const inner = 0.4;
  const hole = 0.16;
  const shape = new THREE.Shape();
  const seg = teeth * 2;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const rr = i % 2 === 0 ? outer : inner;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const h = new THREE.Path();
  h.absarc(0, 0, hole, 0, Math.PI * 2, true);
  shape.holes.push(h);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false, curveSegments: 4 });
  geo.center();
  return geo;
}

interface Placed {
  pos: [number, number, number];
  quat: [number, number, number, number];
}
interface GearData extends Placed {
  scale: number;
  speed: number;
  dir: number;
}
interface StationData extends Placed {
  speed: number;
  dir: number;
  type: number;
}
interface DropData {
  x: number;
  z: number;
  y: number;
  speed: number;
}

export default function IntecproPlanet({ onApproach, onHover }: PlanetProps) {
  const project = getProject('intecpro')!;
  const p = project.planet;
  const R = p.radius;
  const [hovered, setHovered] = useState(false);

  const planet = useRef<THREE.Group>(null);
  const surfaceMat = useRef<THREE.MeshStandardMaterial>(null);
  const bigGearRefs = useRef<(THREE.Mesh | null)[]>([]);
  const stationGearA = useRef<(THREE.Mesh | null)[]>([]);
  const stationGearB = useRef<(THREE.Mesh | null)[]>([]);
  const dropRefs = useRef<(THREE.Mesh | null)[]>([]);

  const plateTex = useMemo(() => makePlateTexture(), []);
  const beltTex = useMemo(() => makeBeltTexture(), []);
  const gearGeo = useMemo(() => makeGearGeometry(), []);
  const gearMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#cdd2da', metalness: 0.9, roughness: 0.35 }),
    [],
  );
  useEffect(
    () => () => {
      plateTex.dispose();
      beltTex.dispose();
      gearGeo.dispose();
      gearMat.dispose();
    },
    [plateTex, beltTex, gearGeo, gearMat],
  );

  // Coloca un punto sobre la esfera (Fibonacci) con orientación tangente.
  const place = (i: number, n: number, thetaMul: number): Placed => {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * i * thetaMul;
    const nrm = new THREE.Vector3(Math.cos(theta) * rad, y, Math.sin(theta) * rad).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, nrm);
    const c = nrm.clone().multiplyScalar(R);
    return { pos: [c.x, c.y, c.z], quat: [q.x, q.y, q.z, q.w] };
  };

  const bigGears = useMemo<GearData[]>(() => {
    const n = 12;
    const arr: GearData[] = [];
    for (let i = 0; i < n; i++) {
      arr.push({ ...place(i, n, 1), scale: 0.55 + (i % 3) * 0.18, speed: 0.5 + (i % 4) * 0.25, dir: i % 2 ? 1 : -1 });
    }
    return arr;
  }, [R]);

  const stations = useMemo<StationData[]>(() => {
    const n = 6;
    const arr: StationData[] = [];
    for (let i = 0; i < n; i++) {
      arr.push({ ...place(i + 0.5, n, 2.2), speed: 1 + (i % 3) * 0.4, dir: i % 2 ? 1 : -1, type: i % 3 });
    }
    return arr;
  }, [R]);

  const topEdge = useMemo(() => new THREE.Vector3(0.5, R + 0.3, 0.4), [R]);
  const fallLen = R * 2.4 + 3;
  const drops = useMemo<DropData[]>(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: topEdge.x + (Math.random() - 0.5) * 0.6,
        z: topEdge.z + (Math.random() - 0.5) * 0.6,
        y: topEdge.y - (i / 6) * fallLen,
        speed: 3 + Math.random() * 1.5,
      })),
    [topEdge, fallLen],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const boost = hovered ? 1 : 0;

    if (planet.current) planet.current.rotation.y += dt * 0.08;
    if (surfaceMat.current) {
      surfaceMat.current.emissiveIntensity = 0.16 + Math.sin(t * 2) * 0.05 + boost * 0.25;
    }

    beltTex.offset.x -= dt * 0.5 * (1 + boost * 0.6);

    for (let i = 0; i < bigGearRefs.current.length; i++) {
      const g = bigGearRefs.current[i];
      if (g) g.rotation.z += dt * bigGears[i].speed * bigGears[i].dir * (1 + boost);
    }
    for (let i = 0; i < stations.length; i++) {
      const spin = dt * stations[i].speed * stations[i].dir * (1 + boost);
      const a = stationGearA.current[i];
      const b = stationGearB.current[i];
      if (a) a.rotation.z += spin;
      if (b) b.rotation.z -= spin;
    }

    const ds = hovered ? 1.6 : 1;
    for (let i = 0; i < dropRefs.current.length; i++) {
      const d = dropRefs.current[i];
      const data = drops[i];
      if (!d) continue;
      data.y -= data.speed * ds * dt;
      if (data.y < topEdge.y - fallLen) {
        data.y = topEdge.y;
        data.x = topEdge.x + (Math.random() - 0.5) * 0.6;
        data.z = topEdge.z + (Math.random() - 0.5) * 0.6;
      }
      d.position.set(data.x, data.y, data.z);
      const below = topEdge.y - data.y;
      (d.material as THREE.MeshStandardMaterial).opacity = Math.min(1, below / 1.2) * (1 - below / fallLen);
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
      ringRadius={R * 1.15}
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
      {/* Planeta-fábrica (rota lento; todo lo industrial gira con él) */}
      <group ref={planet}>
        <mesh>
          <icosahedronGeometry args={[R, 4]} />
          <meshStandardMaterial
            ref={surfaceMat}
            map={plateTex}
            color={p.color}
            roughness={0.62}
            metalness={0.2}
            emissive="#7a3c0a"
            emissiveIntensity={0.16}
            flatShading
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[R * 0.995, 2]} />
          <meshBasicMaterial color={p.accent} wireframe transparent opacity={0.14} toneMapped={false} />
        </mesh>

        {/* Engranajes que sobresalen por todo el planeta (silueta industrial) */}
        {bigGears.map((g, i) => (
          <group key={`gear-${i}`} position={g.pos} quaternion={g.quat}>
            <mesh position={[0, 0.16, 0]}>
              <cylinderGeometry args={[0.17, 0.22, 0.34, 12]} />
              <meshStandardMaterial color="#3a3f4a" metalness={0.85} roughness={0.4} />
            </mesh>
            <group position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh
                ref={(el) => {
                  bigGearRefs.current[i] = el;
                }}
                geometry={gearGeo}
                material={gearMat}
                scale={g.scale}
              />
            </group>
          </group>
        ))}

        {/* Líneas de embotellado: una CINTA larga que conecta dos máquinas */}
        {stations.map((s, i) => (
          <group key={`st-${i}`} position={s.pos} quaternion={s.quat}>
            {/* patas de la cinta */}
            {[-0.55, 0.55].map((x, k) => (
              <mesh key={k} position={[x, 0.12, 0]}>
                <boxGeometry args={[0.1, 0.24, 0.42]} />
                <meshStandardMaterial color="#2a2f3a" metalness={0.6} roughness={0.5} />
              </mesh>
            ))}
            {/* cinta transportadora (conecta las dos máquinas) */}
            <mesh position={[0, 0.26, 0]}>
              <boxGeometry args={[1.5, 0.06, 0.34]} />
              <meshStandardMaterial map={beltTex} color="#cfd2d8" roughness={0.85} metalness={0.1} />
            </mesh>
            {[-0.75, 0.75].map((x, k) => (
              <mesh key={k} position={[x, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.36, 12]} />
                <meshStandardMaterial color="#9aa1ad" metalness={0.8} roughness={0.3} />
              </mesh>
            ))}
            {[-0.17, 0.17].map((z, k) => (
              <mesh key={k} position={[0, 0.32, z]}>
                <boxGeometry args={[1.5, 0.03, 0.03]} />
                <meshStandardMaterial color="#c7ccd6" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
            {/* botellas viajando (verde antes, vino después del centro) */}
            {[-0.55, -0.2, 0.18, 0.5].map((x, k) => {
              const wine = x > 0.05;
              return (
                <mesh key={k} position={[x, 0.37, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.18, 8]} />
                  <meshStandardMaterial
                    color={wine ? '#5a1320' : '#1f5132'}
                    emissive={wine ? '#3b0a0a' : '#000000'}
                    emissiveIntensity={wine ? 0.3 : 0}
                    roughness={0.3}
                    metalness={0.1}
                  />
                </mesh>
              );
            })}

            {/* MÁQUINA IZQUIERDA (llenadora): la cinta entra en ella */}
            <group position={[-0.95, 0, 0]}>
              <mesh position={[0, 0.42, 0]}>
                <boxGeometry args={[0.42, 0.72, 0.52]} />
                <meshStandardMaterial color="#9aa1ad" metalness={0.7} roughness={0.4} />
              </mesh>
              {/* engranaje encima, mirando hacia fuera */}
              <group position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh
                  ref={(el) => {
                    stationGearA.current[i] = el;
                  }}
                  geometry={gearGeo}
                  material={gearMat}
                  scale={0.3}
                />
              </group>
              {/* boquilla que baja a la cinta */}
              <mesh position={[0.32, 0.4, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
                <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.4} />
              </mesh>
            </group>

            {/* MÁQUINA DERECHA (taponadora / prensa): la cinta entra en ella */}
            <group position={[0.95, 0, 0]}>
              <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.42, 0.68, 0.52]} />
                <meshStandardMaterial
                  color={s.type === 0 ? '#7f1d1d' : '#6b7280'}
                  emissive={s.type === 0 ? '#3b0a0a' : '#000000'}
                  emissiveIntensity={s.type === 0 ? 0.25 : 0}
                  metalness={0.6}
                  roughness={0.45}
                />
              </mesh>
              <group position={[0, 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh
                  ref={(el) => {
                    stationGearB.current[i] = el;
                  }}
                  geometry={gearGeo}
                  material={gearMat}
                  scale={0.28}
                />
              </group>
            </group>
          </group>
        ))}
      </group>

      {/* Vino derramándose por el borde */}
      {drops.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dropRefs.current[i] = el;
          }}
          scale={[0.5, 0.9, 0.5]}
        >
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial
            color="#9d1b1b"
            emissive="#4c0d0d"
            emissiveIntensity={0.4}
            transparent
            opacity={0.9}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Atmósfera + rim glow cálido */}
      <mesh>
        <sphereGeometry args={[R * 1.14, 32, 32]} />
        <meshBasicMaterial
          color="#ffcf9e"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.3, 32, 32]} />
        <meshBasicMaterial
          color="#e8861f"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </PlanetBody>
  );
}
