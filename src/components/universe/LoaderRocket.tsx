import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import RocketModel from './RocketModel';
import {
  CAM_ARRIVE_LOOK,
  CAM_ARRIVE_POS,
  ROCKET_DUR,
  SHIP_ARRIVE,
  SHIP_START,
} from './intro';

/**
 * Cohete de la pantalla de carga: es el MISMO modelo 3D que pilota el usuario,
 * renderizado en un canvas TRANSPARENTE por encima del warp. Aparece abajo, se
 * propulsa hasta el centro y avisa (window.__shipArrived) para el flash a blanco.
 * La cámara coincide con la de llegada de la escena principal, así el cohete
 * queda del mismo tamaño y sitio cuando se revela el universo 3D.
 */
function FlyingRocket() {
  const group = useRef<THREE.Group>(null);
  const thrust = useRef(0.25);
  const launched = useRef(false);
  const t = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Dirección de avance (constante): el morro siempre apunta recto adonde va.
  const dir = useMemo(
    () => new THREE.Vector3().subVectors(SHIP_ARRIVE, SHIP_START).normalize(),
    [],
  );
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const w = window as unknown as { __warpRocket?: boolean; __shipArrived?: boolean };

    // Antes del lanzamiento: espera abajo, fuera de cuadro, mirando hacia arriba.
    if (!launched.current) {
      g.position.copy(SHIP_START);
      dummy.position.copy(g.position);
      lookAt.copy(g.position).add(dir);
      dummy.lookAt(lookAt);
      g.quaternion.copy(dummy.quaternion);
      thrust.current = 0.28;
      if (w.__warpRocket) launched.current = true;
      return;
    }

    if (t.current < 1) {
      t.current = Math.min(1, t.current + dt / ROCKET_DUR);
      const p = t.current;
      const e = p * p * (3 - 2 * p); // smoothstep
      g.position.lerpVectors(SHIP_START, SHIP_ARRIVE, e);
      dummy.position.copy(g.position);
      lookAt.copy(g.position).add(dir);
      dummy.lookAt(lookAt);
      g.quaternion.copy(dummy.quaternion);
      thrust.current = 0.7 + Math.sin(p * Math.PI) * 0.6; // más empuje a media subida
      if (p >= 1) w.__shipArrived = true;
    } else {
      g.position.copy(SHIP_ARRIVE);
      thrust.current = 0.95; // estacionario en el centro hasta el flash
    }
  });

  return (
    <group ref={group}>
      <RocketModel thrustRef={thrust} />
    </group>
  );
}

export default function LoaderRocket() {
  const [gone, setGone] = useState(false);

  // Se autodesmonta al terminar el reveal para liberar el contexto WebGL.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if ((window as unknown as { __warpDone?: boolean }).__warpDone) {
        setGone(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (gone) return null;

  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      camera={{ position: CAM_ARRIVE_POS.toArray(), fov: 56, near: 0.1, far: 400 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      onCreated={({ camera }) => camera.lookAt(CAM_ARRIVE_LOOK)}
    >
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#8ab4ff', '#1a1030', 0.55]} />
      <directionalLight position={[12, 16, 10]} intensity={1.35} color="#fff6e8" />
      <pointLight position={[0, 0, 6]} intensity={1.2} distance={40} color="#8b5cf6" />
      <FlyingRocket />
    </Canvas>
  );
}
