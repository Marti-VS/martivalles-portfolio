import type * as THREE from 'three';
import type { Project } from '../../data/content';

/** Carga útil que envía un planeta cuando se pulsa: la nave volará hacia él. */
export interface PlanetApproach {
  id: string;
  /** Centro del planeta en el mundo. */
  position: [number, number, number];
  /** Radio del planeta (para calcular dónde se detiene la nave). */
  radius: number;
  label: string;
  sublabel: string;
  /** URL externa a abrir al aterrizar (null para el planeta About). */
  url: string | null;
  project: Project | null;
}

/** Objetivo de navegación actual de la nave (mutable, leído por frame). */
export interface NavTarget {
  pos: THREE.Vector3;
  approach: PlanetApproach | null;
}

export type ApproachFn = (a: PlanetApproach) => void;
export type MoveFn = (point: THREE.Vector3) => void;

/** Props comunes que recibe cada planeta concreto. */
export interface PlanetProps {
  onApproach: ApproachFn;
  /** Notifica al universo qué planeta se está sobrevolando (o null al salir). */
  onHover?: (a: PlanetApproach | null) => void;
}
