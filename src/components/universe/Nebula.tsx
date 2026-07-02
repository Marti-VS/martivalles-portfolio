import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/** Crea una textura radial suave para las nubes de nebulosa. */
function useSoftTexture() {
  return useMemo(() => {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

const CLOUDS: { pos: [number, number, number]; scale: number; color: string; opacity: number }[] = [
  { pos: [-30, 10, -40], scale: 70, color: '#6d28d9', opacity: 0.22 },
  { pos: [40, -14, -30], scale: 64, color: '#0e7490', opacity: 0.2 },
  { pos: [10, 24, -55], scale: 80, color: '#be1e6e', opacity: 0.16 },
  { pos: [-45, -20, 10], scale: 58, color: '#1d4ed8', opacity: 0.18 },
  { pos: [25, 6, 40], scale: 52, color: '#7c3aed', opacity: 0.16 },
  { pos: [-66, 22, 18], scale: 96, color: '#4338ca', opacity: 0.13 },
  { pos: [60, 30, 26], scale: 82, color: '#9333ea', opacity: 0.12 },
  { pos: [4, -34, -64], scale: 110, color: '#0891b2', opacity: 0.11 },
  { pos: [-22, 38, 58], scale: 72, color: '#db2777', opacity: 0.12 },
  { pos: [48, -28, 52], scale: 68, color: '#f59e0b', opacity: 0.08 },
];

export default function Nebula() {
  const tex = useSoftTexture();
  // Liberar la textura de GPU al desmontar
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group>
      {CLOUDS.map((c, i) => (
        <sprite key={i} position={c.pos} scale={[c.scale, c.scale, 1]}>
          <spriteMaterial
            map={tex}
            color={c.color}
            transparent
            opacity={c.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}
