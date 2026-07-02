import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  shipPos: React.RefObject<THREE.Vector3>;
  shipVel: React.RefObject<THREE.Vector3>;
}

/**
 * Cámara CENITAL INCLINADA (vista de dron). Al entrar hace una INTRO tipo
 * crane-up: arranca desde un ángulo bajo y atrás y se eleva hasta la vista
 * cenital (~3.2s, easeOut), que coincide con el desvanecido del warp de carga.
 * Después sigue a un ancla a medio camino entre el centro y la nave para que
 * siempre se vean los planetas, con parallax sutil de ratón.
 */
const OFFSET = new THREE.Vector3(0, 48, 26);
const FOLLOW = 0.45;
const PARALLAX = 3.5;
const INTRO_DUR = 2.6; // s
const INTRO_START = new THREE.Vector3(0, 24, 50); // sutil: solo un poco más bajo y atrás
const INTRO_LOOK = new THREE.Vector3(0, 4, 0); // mirada casi al centro

export default function CameraRig({ shipPos, shipVel }: Props) {
  const { camera } = useThree();
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const mouse = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const introT = useRef(0);
  const started = useRef(false); // arranca el crane cuando el warp termina
  const waited = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pos = shipPos.current!;
    const vel = shipVel.current!;

    anchor.copy(pos).multiplyScalar(FOLLOW);
    lookTarget.copy(anchor).addScaledVector(vel, 0.05);
    desired.copy(anchor).add(OFFSET);

    // Espera en el ángulo bajo hasta que el warp de carga se desvanece.
    if (!started.current) {
      waited.current += dt;
      const warpDone = (window as unknown as { __warpDone?: boolean }).__warpDone === true;
      if (warpDone || waited.current > 6) {
        started.current = true;
      } else {
        camera.position.copy(INTRO_START);
        look.copy(INTRO_LOOK);
        camera.lookAt(look);
        return;
      }
    }

    introT.current = Math.min(1, introT.current + dt / INTRO_DUR);
    if (introT.current < 1) {
      // Crane-up: de abajo/atrás a la vista cenital, con easeOut.
      const e = 1 - Math.pow(1 - introT.current, 3);
      camera.position.lerpVectors(INTRO_START, desired, e);
      look.lerpVectors(INTRO_LOOK, lookTarget, e);
      camera.lookAt(look);
    } else {
      // Seguimiento normal con parallax suave de ratón.
      smooth.current.x += (mouse.current.x - smooth.current.x) * Math.min(1, dt * 2);
      smooth.current.y += (mouse.current.y - smooth.current.y) * Math.min(1, dt * 2);
      desired.x += smooth.current.x * PARALLAX;
      desired.z += smooth.current.y * PARALLAX * 0.6;
      camera.position.lerp(desired, Math.min(1, dt * 1.8));
      look.lerp(lookTarget, Math.min(1, dt * 2.6));
      camera.lookAt(look);
    }
  });

  return null;
}
