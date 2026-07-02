import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NavTarget, PlanetApproach } from './types';

interface Props {
  navTarget: React.RefObject<NavTarget>;
  shipPos: React.RefObject<THREE.Vector3>;
  shipVel: React.RefObject<THREE.Vector3>;
  onArrive: (a: PlanetApproach) => void;
}

const MAX_SPEED = 26;

export default function Ship({ navTarget, shipPos, shipVel, onArrive }: Props) {
  const group = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);
  const flameMid = useRef<THREE.Mesh>(null);
  const flameInner = useRef<THREE.Mesh>(null);
  const flameGlow = useRef<THREE.Mesh>(null);
  const engineLight = useRef<THREE.PointLight>(null);
  const arrivedRef = useRef<PlanetApproach | null>(null);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const desiredVel = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const nav = navTarget.current;
    const vel = shipVel.current!;

    // Vector hacia el objetivo
    tmp.copy(nav.pos).sub(g.position);
    const dist = tmp.length();

    // Velocidad deseada: acelera lejos, frena al acercarse
    const desiredSpeed = Math.min(MAX_SPEED, dist * 2.4);
    if (dist > 0.0001) {
      dir.copy(tmp).multiplyScalar(1 / dist);
      desiredVel.copy(dir).multiplyScalar(desiredSpeed);
    } else {
      desiredVel.set(0, 0, 0);
    }
    vel.lerp(desiredVel, Math.min(1, dt * 3.2));
    g.position.addScaledVector(vel, dt);
    const speed = vel.length();

    // Orientación: morro (+Z) hacia la dirección de avance
    if (speed > 0.25) {
      lookTarget.copy(g.position).add(vel);
      dummy.position.copy(g.position);
      dummy.lookAt(lookTarget);
      g.quaternion.slerp(dummy.quaternion, Math.min(1, dt * 4));
      // Alabeo según giro
      const bank = THREE.MathUtils.clamp(-vel.x * 0.012, -0.4, 0.4);
      g.rotation.z += (bank - g.rotation.z) * Math.min(1, dt * 3);
    }

    // Bobaleo sutil en reposo
    const idle = speed < 0.6 ? Math.sin(state.clock.elapsedTime * 1.4) * 0.06 : 0;
    g.position.y += idle * dt;

    // Propulsores: la llama SIEMPRE se ve (es un cohete) y se alarga al acelerar.
    // La longitud va en el eje Y del cono (su altura), el ancho en X/Z.
    const thrust = THREE.MathUtils.clamp(speed / MAX_SPEED, 0, 1);
    const flick = 0.85 + Math.sin(state.clock.elapsedTime * 38) * 0.15;
    const flick2 = 0.9 + Math.sin(state.clock.elapsedTime * 55 + 1.3) * 0.1;
    if (flame.current) {
      const w = 0.9 + thrust * 0.3;
      flame.current.scale.set(w, (1 + thrust * 2.4) * flick, w);
      (flame.current.material as THREE.MeshBasicMaterial).opacity = 0.45 + thrust * 0.45;
    }
    if (flameMid.current) {
      flameMid.current.scale.set(0.78, (0.85 + thrust * 2.0) * flick2, 0.78);
    }
    if (flameInner.current) {
      flameInner.current.scale.set(0.6, (0.7 + thrust * 1.5) * flick2, 0.6);
    }
    if (flameGlow.current) {
      const g = 0.7 + thrust * 0.7 + Math.sin(state.clock.elapsedTime * 30) * 0.05;
      flameGlow.current.scale.setScalar(g);
      (flameGlow.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + thrust * 0.4;
    }
    if (engineLight.current) {
      engineLight.current.intensity = 2 + thrust * 8;
    }

    // Detección de aterrizaje
    if (!nav.approach) {
      arrivedRef.current = null;
    } else if (arrivedRef.current !== nav.approach && dist < 0.8) {
      arrivedRef.current = nav.approach;
      onArrive(nav.approach);
    }

    // Compartir posición para la cámara
    shipPos.current!.copy(g.position);
  });

  return (
    <group ref={group} position={[0, 0, 18]}>
      {/* Cuerpo blanco */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.34, 1.3, 24]} />
        <meshStandardMaterial color="#f4f6fb" metalness={0.5} roughness={0.32} />
      </mesh>
      {/* Morro rojo */}
      <mesh position={[0, 0, 0.92]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.3, 0.62, 24]} />
        <meshStandardMaterial color="#e23a2e" metalness={0.4} roughness={0.35} />
      </mesh>
      {/* Franja roja */}
      <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.33, 0.055, 12, 28]} />
        <meshStandardMaterial color="#e23a2e" metalness={0.45} roughness={0.35} />
      </mesh>
      {/* Cabina */}
      <mesh position={[0, 0.21, 0.34]}>
        <sphereGeometry args={[0.17, 18, 18]} />
        <meshStandardMaterial
          color="#0e1830"
          emissive="#38e8ff"
          emissiveIntensity={0.8}
          metalness={0.4}
          roughness={0.12}
        />
      </mesh>
      {/* Aletas rojas (3) */}
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
          <mesh position={[0, 0.34, -0.42]} castShadow>
            <boxGeometry args={[0.04, 0.32, 0.55]} />
            <meshStandardMaterial color="#e23a2e" metalness={0.4} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Tobera */}
      <mesh position={[0, 0, -0.74]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 0.32, 22]} />
        <meshStandardMaterial color="#3a3f4a" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* Llamas en 3 capas, apuntando hacia atrás (-Z); la altura del cono es Y */}
      <mesh ref={flame} position={[0, 0, -1.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.3, 1, 22, 1, true]} />
        <meshBasicMaterial color="#ff5a1e" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={flameMid} position={[0, 0, -1.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.21, 1, 20, 1, true]} />
        <meshBasicMaterial color="#ffb13d" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={flameInner} position={[0, 0, -0.96]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.13, 0.9, 16, 1, true]} />
        <meshBasicMaterial color="#e8fbff" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* Glow del motor */}
      <mesh ref={flameGlow} position={[0, 0, -0.82]}>
        <sphereGeometry args={[0.34, 16, 16]} />
        <meshBasicMaterial color="#ff8a3d" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={engineLight} position={[0, 0, -1.2]} color="#ff7a33" intensity={2} distance={10} />
    </group>
  );
}
