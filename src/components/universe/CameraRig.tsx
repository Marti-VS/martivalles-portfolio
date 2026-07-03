import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CAM_ARRIVE_LOOK,
  CAM_ARRIVE_POS,
  SETTLE_DUR,
  type IntroState,
} from './intro';

interface Props {
  shipPos: React.RefObject<THREE.Vector3>;
  shipVel: React.RefObject<THREE.Vector3>;
  intro: React.RefObject<IntroState>;
}

/**
 * Cámara CENITAL INCLINADA (vista de dron).
 *
 * Durante la intro ('wait') la cámara se queda fija encuadrando el CENTRO
 * (tapada por el loader/flash blanco). Al revelar ('settle') hace un crane desde
 * ese encuadre hasta la vista de dron. Después ('done') sigue a la nave con
 * parallax y permite hacer zoom con la rueda del ratón.
 */
const OFFSET = new THREE.Vector3(0, 48, 26);
const FOLLOW = 0.45;
const PARALLAX = 3.5;
// Zoom: multiplica la distancia de la cámara al ancla (1 = vista por defecto).
const ZOOM_MIN = 0.5; // más cerca
const ZOOM_MAX = 1.7; // más lejos

export default function CameraRig({ shipPos, shipVel, intro }: Props) {
  const { camera } = useThree();
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const mouse = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const zoom = useRef(1);
  const zoomTarget = useRef(1);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onWheel = (e: WheelEvent) => {
      // Rueda arriba = acercar; rueda abajo = alejar.
      const factor = Math.exp(e.deltaY * 0.0012);
      zoomTarget.current = THREE.MathUtils.clamp(
        zoomTarget.current * factor,
        ZOOM_MIN,
        ZOOM_MAX,
      );
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('wheel', onWheel);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pos = shipPos.current!;
    const vel = shipVel.current!;
    const it = intro.current!;

    anchor.copy(pos).multiplyScalar(FOLLOW);
    lookTarget.copy(anchor).addScaledVector(vel, 0.05);
    desired.copy(anchor).add(OFFSET);

    // Espera: encuadre fijo del centro (tapado por el loader/flash blanco).
    if (it.phase === 'wait') {
      camera.position.copy(CAM_ARRIVE_POS);
      look.copy(CAM_ARRIVE_LOOK);
      camera.lookAt(look);
      return;
    }

    // Crane: del encuadre de llegada a la vista de dron (transición al 3D).
    if (it.phase === 'settle') {
      it.t = Math.min(1, it.t + dt / SETTLE_DUR);
      const e = 1 - Math.pow(1 - it.t, 3); // easeOut
      camera.position.lerpVectors(CAM_ARRIVE_POS, desired, e);
      look.lerpVectors(CAM_ARRIVE_LOOK, lookTarget, e);
      camera.lookAt(look);
      if (it.t >= 1) {
        it.phase = 'done';
        look.copy(lookTarget); // sincroniza el suavizado del seguimiento
      }
      return;
    }

    // Seguimiento normal con parallax suave de ratón + zoom con la rueda.
    zoom.current += (zoomTarget.current - zoom.current) * Math.min(1, dt * 6);
    desired.copy(anchor).addScaledVector(OFFSET, zoom.current);
    smooth.current.x += (mouse.current.x - smooth.current.x) * Math.min(1, dt * 2);
    smooth.current.y += (mouse.current.y - smooth.current.y) * Math.min(1, dt * 2);
    desired.x += smooth.current.x * PARALLAX;
    desired.z += smooth.current.y * PARALLAX * 0.6;
    camera.position.lerp(desired, Math.min(1, dt * 1.8));
    look.lerp(lookTarget, Math.min(1, dt * 2.6));
    camera.lookAt(look);
  });

  return null;
}
