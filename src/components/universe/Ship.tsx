import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NavTarget, PlanetApproach } from './types';
import { SHIP_ARRIVE, SHIP_FACE, type IntroState } from './intro';
import RocketModel from './RocketModel';

interface Props {
  navTarget: React.RefObject<NavTarget>;
  shipPos: React.RefObject<THREE.Vector3>;
  shipVel: React.RefObject<THREE.Vector3>;
  intro: React.RefObject<IntroState>;
  onArrive: (a: PlanetApproach) => void;
}

const MAX_SPEED = 26;

export default function Ship({ navTarget, shipPos, shipVel, intro, onArrive }: Props) {
  const reduce = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const group = useRef<THREE.Group>(null);
  const arrivedRef = useRef<PlanetApproach | null>(null);
  const thrust = useRef(0.12);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const desiredVel = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const nav = navTarget.current!;
    const vel = shipVel.current!;
    const it = intro.current!;

    // ------------------------------------------------------------- INTRO: espera
    // La llegada del cohete la hace el MISMO modelo 3D en un canvas transparente
    // sobre el warp de carga (LoaderRocket). Aquí la nave solo descansa en el
    // centro hasta que el flash pide revelar; entonces la cámara hace el crane.
    if (it.phase === 'wait') {
      g.position.copy(SHIP_ARRIVE);
      dummy.position.copy(g.position);
      dummy.lookAt(SHIP_FACE);
      g.quaternion.copy(dummy.quaternion);
      vel.set(0, 0, 0);
      nav.pos.copy(SHIP_ARRIVE);
      nav.approach = null;
      shipPos.current!.copy(g.position);

      const w = window as unknown as { __warpReveal?: boolean; __warpDone?: boolean };
      it.t += dt;
      if (reduce || w.__warpReveal || w.__warpDone || it.t > 8) {
        it.phase = 'settle';
        it.t = 0;
        // cae al bloque de física (se queda quieta en el centro)
      } else {
        return; // aún tapada por el loader
      }
    }

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

    // Orientación: el morro (+Z) apunta RECTO al destino (no a la velocidad),
    // así siempre mira adonde tiene que ir. En reposo mantiene su orientación.
    if (dist > 0.4) {
      lookTarget.copy(g.position).add(dir);
      dummy.position.copy(g.position);
      dummy.lookAt(lookTarget);
      g.quaternion.slerp(dummy.quaternion, Math.min(1, dt * 7));
      // Alabeo sutil según el giro
      const bank = THREE.MathUtils.clamp(-vel.x * 0.012, -0.4, 0.4);
      g.rotation.z += (bank - g.rotation.z) * Math.min(1, dt * 3);
    }

    // Bobaleo sutil en reposo
    const idle = speed < 0.6 ? Math.sin(state.clock.elapsedTime * 1.4) * 0.06 : 0;
    g.position.y += idle * dt;

    // Empuje para la llama del modelo
    thrust.current = THREE.MathUtils.clamp(speed / MAX_SPEED, 0, 1);

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
    <group ref={group} position={SHIP_ARRIVE.toArray()}>
      <RocketModel thrustRef={thrust} />
    </group>
  );
}
