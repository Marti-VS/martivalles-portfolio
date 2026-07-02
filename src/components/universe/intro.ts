import * as THREE from 'three';

/**
 * Coreografía de entrada al universo, compartida por la nave y la cámara.
 *
 * La LLEGADA del cohete la hace el MISMO modelo 3D (RocketModel) en un canvas
 * transparente sobre el warp de carga (ver LoaderRocket + src/pages/universo.astro):
 * aparece abajo, se propulsa al centro y termina en un flash a blanco. Aquí, en
 * la escena principal, solo se REVELA la nave ya en el centro y la cámara hace el
 * "crane" hasta la vista de dron.
 *
 *  wait   → la nave espera en el centro, tapada por el loader/flash blanco.
 *  settle → la cámara hace el crane del encuadre de llegada a la vista de dron.
 *  done   → juego normal (seguimiento + parallax).
 */
export type IntroPhase = 'wait' | 'settle' | 'done';

export interface IntroState {
  phase: IntroPhase;
  /** Reloj de la fase actual (s o progreso 0..1 según la fase). */
  t: number;
}

/** Punto de entrada del cohete durante la carga: abajo, fuera de cuadro. */
export const SHIP_START = new THREE.Vector3(0, -13, 9);
/** La nave descansa en el centro del universo = centro de la pantalla. */
export const SHIP_ARRIVE = new THREE.Vector3(0, 0, 0);
/** Duración de la subida del cohete al centro (s). */
export const ROCKET_DUR = 1.5;
/** Punto al que mira la nave al aparecer: hacia el "norte" (-Z), como recién
 *  llegada tras subir desde abajo en la pantalla de carga. */
export const SHIP_FACE = new THREE.Vector3(0, 1, -10);

/** Cámara al revelar el 3D: cerca del centro (nave a tamaño parecido al cohete
 *  2D al desvanecerse el flash) y nítida, sin niebla. */
export const CAM_ARRIVE_POS = new THREE.Vector3(0, 5, 14);
export const CAM_ARRIVE_LOOK = new THREE.Vector3(0, 0, 0);
/** Duración del crane hasta la vista de dron (s). */
export const SETTLE_DUR = 2.4;
