import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  /** Empuje 0..1+ (longitud/brillo de la llama). Se lee por frame. */
  thrustRef?: React.RefObject<number>;
}

/**
 * Modelo 3D del cohete (cuerpo, morro, aletas, cabina, tobera y llamas).
 * Es el MISMO modelo que pilota el usuario en el universo y el que aparece
 * subiendo al centro en la pantalla de carga (ver LoaderRocket).
 * La llama se anima sola según `thrustRef`.
 */
export default function RocketModel({ thrustRef }: Props) {
  const flame = useRef<THREE.Mesh>(null);
  const flameMid = useRef<THREE.Mesh>(null);
  const flameInner = useRef<THREE.Mesh>(null);
  const flameGlow = useRef<THREE.Mesh>(null);
  const engineLight = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const thrust = THREE.MathUtils.clamp(thrustRef?.current ?? 0.12, 0, 1.6);
    const t = state.clock.elapsedTime;
    const flick = 0.85 + Math.sin(t * 38) * 0.15;
    const flick2 = 0.9 + Math.sin(t * 55 + 1.3) * 0.1;
    // La base de la llama se ancla a la salida de la tobera (-Z) y SOLO crece
    // hacia atrás. Como los conos tienen la geometría centrada, al escalar la
    // altura reposicionamos el cono para que la base no se meta en el cuerpo.
    const NOZZLE_Z = -0.88;
    if (flame.current) {
      const w = 0.9 + thrust * 0.3;
      const sy = (1 + thrust * 2.4) * flick; // cono de altura 1 → semialtura 0.5
      flame.current.scale.set(w, sy, w);
      flame.current.position.z = NOZZLE_Z - 0.5 * sy;
      (flame.current.material as THREE.MeshBasicMaterial).opacity = 0.45 + thrust * 0.45;
    }
    if (flameMid.current) {
      const sy = (0.85 + thrust * 2.0) * flick2; // altura 1 → semialtura 0.5
      flameMid.current.scale.set(0.78, sy, 0.78);
      flameMid.current.position.z = NOZZLE_Z - 0.5 * sy;
    }
    if (flameInner.current) {
      const sy = (0.7 + thrust * 1.5) * flick2; // altura 0.9 → semialtura 0.45
      flameInner.current.scale.set(0.6, sy, 0.6);
      flameInner.current.position.z = NOZZLE_Z - 0.45 * sy;
    }
    if (flameGlow.current) {
      const g = 0.55 + thrust * 0.55 + Math.sin(t * 30) * 0.04;
      flameGlow.current.scale.setScalar(g);
      (flameGlow.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + thrust * 0.4;
    }
    if (engineLight.current) {
      engineLight.current.intensity = 2 + thrust * 8;
    }
  });

  return (
    <>
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

      {/* Llamas en 3 capas: la base se ancla a la tobera (posición z fijada por
          frame) y el cono crece solo hacia atrás (-Z). La altura del cono es Y. */}
      <mesh ref={flame} position={[0, 0, -1.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.3, 1, 22, 1, true]} />
        <meshBasicMaterial color="#ff5a1e" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={flameMid} position={[0, 0, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.21, 1, 20, 1, true]} />
        <meshBasicMaterial color="#ffb13d" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={flameInner} position={[0, 0, -1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.13, 0.9, 16, 1, true]} />
        <meshBasicMaterial color="#e8fbff" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* Glow del motor (detrás de la tobera) */}
      <mesh ref={flameGlow} position={[0, 0, -1.12]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ff8a3d" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={engineLight} position={[0, 0, -1.3]} color="#ff7a33" intensity={2} distance={10} />
    </>
  );
}
