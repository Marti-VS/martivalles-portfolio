import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { NavTarget } from './types';

interface Props {
  navTarget: React.RefObject<NavTarget>;
  shipPos: React.RefObject<THREE.Vector3>;
}

/**
 * Dibuja la ruta de la nave como una línea discontinua desde su posición actual
 * hasta el punto marcado, con un marcador anillado pulsante en el destino.
 * Se desvanece cuando la nave llega.
 */
export default function RouteLine({ navTarget, shipPos }: Props) {
  const markerRef = useRef<THREE.Group>(null);
  const markerMat = useRef<THREE.MeshBasicMaterial>(null);

  const { line, geom, mat } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineDashedMaterial({
      color: new THREE.Color('#38e8ff'),
      transparent: true,
      opacity: 0,
      dashSize: 1.1,
      gapSize: 0.7,
      depthWrite: false,
      toneMapped: false,
    });
    const line = new THREE.Line(geom, mat);
    line.frustumCulled = false;
    return { line, geom, mat };
  }, []);

  useEffect(
    () => () => {
      geom.dispose();
      mat.dispose();
    },
    [geom, mat],
  );

  useFrame((state) => {
    const a = shipPos.current!;
    const b = navTarget.current!.pos;
    const attr = geom.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    arr[0] = a.x;
    arr[1] = a.y;
    arr[2] = a.z;
    arr[3] = b.x;
    arr[4] = b.y;
    arr[5] = b.z;
    attr.needsUpdate = true;
    line.computeLineDistances();

    const dist = a.distanceTo(b);
    const show = dist > 1.4;
    const pulse = 0.6 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
    mat.opacity += ((show ? 0.55 : 0) - mat.opacity) * 0.15;

    if (markerRef.current) {
      markerRef.current.position.copy(b);
      markerRef.current.scale.setScalar(show ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15 : 0.001);
    }
    if (markerMat.current) markerMat.current.opacity = show ? pulse : 0;
  });

  return (
    <>
      <primitive object={line} />
      <group ref={markerRef}>
        <Billboard>
          <mesh>
            <ringGeometry args={[0.7, 0.92, 40]} />
            <meshBasicMaterial
              ref={markerMat}
              color="#38e8ff"
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      </group>
    </>
  );
}
