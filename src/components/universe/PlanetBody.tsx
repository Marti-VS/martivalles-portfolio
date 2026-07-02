import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { PlanetApproach } from './types';

interface Props {
  position: [number, number, number];
  /** Radio del collider invisible (más grande que el planeta para clic fácil). */
  colliderRadius: number;
  /** Radio del anillo de selección. */
  ringRadius: number;
  accent: string;
  label: string;
  sublabel: string;
  hovered: boolean;
  /** Datos del destino, para el popup descriptivo en hover. */
  approach: PlanetApproach;
  onOver: () => void;
  onOut: () => void;
  onHover?: (a: PlanetApproach | null) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  children: React.ReactNode;
}

export default function PlanetBody({
  position,
  colliderRadius,
  ringRadius,
  accent,
  label,
  sublabel,
  hovered,
  approach,
  onOver,
  onOut,
  onHover,
  onClick,
  children,
}: Props) {
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 8);
    const target = hovered ? 1 : 0;
    if (ring.current) {
      const s = ring.current.scale.x + (0.85 + target * 0.25 - ring.current.scale.x) * k;
      ring.current.scale.setScalar(s);
      ring.current.rotation.z += dt * 0.4;
    }
    if (ringMat.current) {
      ringMat.current.opacity += (target * 0.9 - ringMat.current.opacity) * k;
    }
  });

  return (
    <group position={position}>
      {children}

      {/* Anillo de selección que mira a la cámara */}
      <Billboard>
        <mesh ref={ring} scale={0.85}>
          <ringGeometry args={[ringRadius * 1.18, ringRadius * 1.28, 64]} />
          <meshBasicMaterial
            ref={ringMat}
            color={accent}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>

      {/* Collider invisible para hover/clic */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onOver();
          onHover?.(approach);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onOut();
          onHover?.(null);
          document.body.style.cursor = 'auto';
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
      >
        <sphereGeometry args={[colliderRadius, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Etiqueta al hacer hover */}
      <Html
        position={[0, ringRadius * 1.6, 0]}
        center
        occlude={false}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none' }}
        wrapperClass="pointer-events-none"
      >
        <div
          className={`pointer-events-none select-none whitespace-nowrap rounded-2xl border border-white/15 bg-[#04050d]/85 px-5 py-2.5 text-center backdrop-blur-md transition-all duration-300 ${
            hovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
          style={{ boxShadow: `0 0 34px -6px ${accent}` }}
        >
          <p className="font-display text-2xl font-bold text-white">{label}</p>
          <p className="text-sm" style={{ color: accent }}>
            {sublabel}
          </p>
        </div>
      </Html>
    </group>
  );
}
