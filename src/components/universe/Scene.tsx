import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

import Nebula from './Nebula';
import SpaceDecor from './SpaceDecor';
import Ship from './Ship';
import CameraRig from './CameraRig';
import RouteLine from './RouteLine';
import AboutPlanet from './planets/AboutPlanet';
import DvitaePlanet from './planets/DvitaePlanet';
import KnowmeGalaxy from './planets/KnowmeGalaxy';
import MathbattlePlanet from './planets/MathbattlePlanet';
import IntecproPlanet from './planets/IntecproPlanet';
import DegorgMoon from './planets/DegorgMoon';
import AggityPlanet from './planets/AggityPlanet';

import type { ApproachFn, NavTarget, PlanetApproach } from './types';
import type { IntroState } from './intro';

interface Props {
  navTarget: React.RefObject<NavTarget>;
  shipPos: React.RefObject<THREE.Vector3>;
  shipVel: React.RefObject<THREE.Vector3>;
  intro: React.RefObject<IntroState>;
  onApproach: ApproachFn;
  onArrive: ApproachFn;
  onHover: (a: PlanetApproach | null) => void;
  onSteerStart: () => void;
  camRef: React.RefObject<THREE.Camera | null>;
  elRef: React.RefObject<HTMLCanvasElement | null>;
}

/**
 * Plano invisible horizontal (y=0) que captura la navegación: un clic mueve la
 * nave a ese punto y, si mantienes pulsado, la nave SIGUE al ratón. Los planetas
 * consumen su propio pointerdown, así que pulsarlos no activa el arrastre.
 */
function NavPlane({
  navTarget,
  onSteerStart,
}: {
  navTarget: React.RefObject<NavTarget>;
  onSteerStart: () => void;
}) {
  const steering = useRef(false);

  useEffect(() => {
    const stop = () => {
      steering.current = false;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  const setTarget = (p: THREE.Vector3) => {
    const t = navTarget.current!;
    t.pos.copy(p);
    if (t.pos.length() > 60) t.pos.setLength(60);
    t.approach = null;
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        steering.current = true;
        onSteerStart();
        setTarget(e.point);
      }}
      onPointerMove={(e) => {
        if (steering.current) setTarget(e.point);
      }}
    >
      <planeGeometry args={[400, 400]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Captura cámara y canvas para la navegación por clic en el vacío. */
function CaptureThree({
  camRef,
  elRef,
}: {
  camRef: React.RefObject<THREE.Camera | null>;
  elRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const { camera, gl } = useThree();
  useEffect(() => {
    camRef.current = camera;
    elRef.current = gl.domElement;
  }, [camera, gl, camRef, elRef]);
  return null;
}

export default function Scene({
  navTarget,
  shipPos,
  shipVel,
  intro,
  onApproach,
  onArrive,
  onHover,
  onSteerStart,
  camRef,
  elRef,
}: Props) {
  return (
    <>
      <color attach="background" args={['#04050d']} />
      <fog attach="fog" args={['#04050d', 55, 140]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#8ab4ff', '#1a1030', 0.5]} />
      <directionalLight position={[12, 16, 10]} intensity={1.3} color="#fff6e8" />
      <pointLight position={[0, 0, 0]} intensity={1.4} distance={120} color="#8b5cf6" />

      <Stars radius={140} depth={70} count={6500} factor={4.5} saturation={0} fade speed={0.5} />
      <Nebula />
      <SpaceDecor />

      <CaptureThree camRef={camRef} elRef={elRef} />
      <CameraRig shipPos={shipPos} shipVel={shipVel} intro={intro} />
      <Ship navTarget={navTarget} shipPos={shipPos} shipVel={shipVel} intro={intro} onArrive={onArrive} />
      <RouteLine navTarget={navTarget} shipPos={shipPos} intro={intro} />
      <NavPlane navTarget={navTarget} onSteerStart={onSteerStart} />

      <AboutPlanet onApproach={onApproach} onHover={onHover} />
      <DvitaePlanet onApproach={onApproach} onHover={onHover} />
      <KnowmeGalaxy onApproach={onApproach} onHover={onHover} />
      <MathbattlePlanet onApproach={onApproach} onHover={onHover} />
      <IntecproPlanet onApproach={onApproach} onHover={onHover} />
      <DegorgMoon onApproach={onApproach} onHover={onHover} />
      <AggityPlanet onApproach={onApproach} onHover={onHover} />
    </>
  );
}
