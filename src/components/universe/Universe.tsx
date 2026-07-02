import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import Scene from './Scene';
import { content } from '../../data/content';
import type { NavTarget, PlanetApproach } from './types';
import { SHIP_ARRIVE, type IntroState } from './intro';

export default function Universe() {
  const navTarget = useRef<NavTarget>({
    pos: SHIP_ARRIVE.clone(),
    approach: null,
  });
  const shipPos = useRef(SHIP_ARRIVE.clone());
  const shipVel = useRef(new THREE.Vector3());
  const intro = useRef<IntroState>({ phase: 'wait', t: 0 });
  const camRef = useRef<THREE.Camera | null>(null);
  const elRef = useRef<HTMLCanvasElement | null>(null);

  const [arrived, setArrived] = useState<PlanetApproach | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<PlanetApproach | null>(null);
  const [blocked, setBlocked] = useState(false);

  // Objetos reutilizables para el raycast del clic en el vacío
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const plane = useMemo(() => new THREE.Plane(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  // Lista de destinos (planeta About + proyectos)
  const destinations = useMemo<PlanetApproach[]>(() => {
    const ab = content.aboutPlanet;
    const aboutDest: PlanetApproach = {
      id: ab.kind,
      position: ab.position,
      radius: ab.radius,
      label: ab.label,
      sublabel: content.about.heading,
      url: null,
      project: null,
    };
    const projectDests = content.projects.map<PlanetApproach>((p) => ({
      id: p.id,
      position: p.planet.position,
      radius: p.planet.radius,
      label: p.name,
      sublabel: p.tagline,
      url: p.url,
      project: p,
    }));
    return [aboutDest, ...projectDests];
  }, []);

  const handleApproach = useCallback(
    (a: PlanetApproach) => {
      setArrived(null);
      setBlocked(false);
      const planetPos = new THREE.Vector3(a.position[0], a.position[1], a.position[2]);
      const dir = new THREE.Vector3().subVectors(shipPos.current, planetPos);
      if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
      dir.normalize();
      const stop = planetPos.add(dir.multiplyScalar(a.radius + 3.2));
      navTarget.current.pos.copy(stop);
      navTarget.current.approach = { ...a }; // objeto nuevo -> siempre re-dispara la llegada
    },
    [],
  );

  const handleArrive = useCallback((a: PlanetApproach) => {
    setArrived(a);
    if (a.url) {
      const win = window.open(a.url, '_blank', 'noopener,noreferrer');
      if (!win) setBlocked(true); // el navegador bloqueó la pestaña
    }
  }, []);

  const handleMove = useCallback((point: THREE.Vector3) => {
    setArrived(null);
    navTarget.current.pos.copy(point);
    navTarget.current.approach = null;
  }, []);

  const onPointerMissed = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;
      const cam = camRef.current;
      const el = elRef.current;
      if (!cam || !el) return;
      const rect = el.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, cam);
      cam.getWorldDirection(camDir);
      plane.setFromNormalAndCoplanarPoint(camDir, shipPos.current);
      const res = raycaster.ray.intersectPlane(plane, hit);
      if (res) {
        if (hit.length() > 60) hit.setLength(60);
        handleMove(hit.clone());
      }
    },
    [raycaster, ndc, plane, camDir, hit, handleMove],
  );

  // Cierra el salto a la velocidad de la luz (pantalla de entrada) al montar.
  useEffect(() => {
    const w = window as unknown as { __finishWarp?: () => void; __warpDone?: boolean };
    if (w.__finishWarp) w.__finishWarp();
    else {
      document.getElementById('warp-loader')?.remove();
      w.__warpDone = true;
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-[#04050d]">
      <Canvas
        onPointerMissed={onPointerMissed}
        camera={{ position: [0, 18, 58], fov: 56, near: 0.1, far: 400 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Scene
          navTarget={navTarget}
          shipPos={shipPos}
          shipVel={shipVel}
          intro={intro}
          onApproach={handleApproach}
          onArrive={handleArrive}
          onHover={setHoveredInfo}
          onSteerStart={() => setArrived(null)}
          camRef={camRef}
          elRef={elRef}
        />
      </Canvas>

      {/* ---------------------------------------------------------------- HUD */}
      <div className="pointer-events-none absolute inset-0 select-none">
        {/* Barra superior */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
          <a
            href="/"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#04050d]/70 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10"
          >
            <span aria-hidden="true">←</span> Volver al inicio
          </a>
          <p className="font-display hidden text-sm uppercase tracking-[0.3em] text-[var(--color-stardust)] sm:block">
            Universo de Martí
          </p>
        </div>

        {/* Dock de destinos */}
        <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col gap-1.5 sm:flex">
          {destinations.map((d) => (
            <button
              key={d.id}
              onClick={() => handleApproach(d)}
              className="pointer-events-auto group flex items-center gap-2 rounded-full border border-white/10 bg-[#04050d]/60 py-1.5 pl-1.5 pr-4 text-left text-sm text-[var(--color-stardust)] backdrop-blur-md transition-all hover:border-white/30 hover:text-white"
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${
                    d.project?.planet.accent ?? content.aboutPlanet.accent
                  }, ${d.project?.planet.color ?? content.aboutPlanet.color} 70%, #02030a)`,
                }}
              />
              {d.label}
            </button>
          ))}
        </div>

        {/* Leyenda de controles */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
          <p className="rounded-full border border-white/10 bg-[#04050d]/60 px-4 py-2 text-center text-xs text-[var(--color-stardust)] backdrop-blur-md">
            🪐 Clic en un planeta para viajar y aterrizar · ✦ Clic en el espacio
            para moverte
          </p>
        </div>

        {/* Panel descriptivo: preview al sobrevolar + info al aterrizar */}
        {(arrived ?? hoveredInfo) && (
          <ArrivalPanel
            approach={(arrived ?? hoveredInfo)!}
            landed={!!arrived}
            blocked={blocked}
            onClose={() => setArrived(null)}
          />
        )}
      </div>
    </div>
  );
}

/* --------- Panel descriptivo (preview al sobrevolar + info al aterrizar) -- */
function ArrivalPanel({
  approach,
  landed,
  blocked,
  onClose,
}: {
  approach: PlanetApproach;
  landed: boolean;
  blocked: boolean;
  onClose: () => void;
}) {
  const project = approach.project;
  const accent = project?.planet.accent ?? content.aboutPlanet.accent;
  const paragraph = project ? project.description[0] : content.about.paragraphs[0];
  const chips = project ? project.technologies : content.about.interests;

  return (
    <div
      className={`absolute bottom-20 left-1/2 w-[min(92vw,30rem)] -translate-x-1/2 transition-opacity duration-200 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 ${
        landed ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div
        className="rounded-3xl border border-white/12 bg-[#070a18]/92 p-6 shadow-2xl backdrop-blur-xl"
        style={{ boxShadow: `0 0 50px -12px ${accent}` }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p
              className="font-display text-[11px] uppercase tracking-[0.25em]"
              style={{ color: accent }}
            >
              {landed ? 'Has aterrizado en' : 'Próximo destino'}
            </p>
            <p className="font-display text-2xl font-bold text-white">{approach.label}</p>
            <p className="text-sm text-[var(--color-stardust)]">{approach.sublabel}</p>
          </div>
          {landed && (
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-full border border-white/10 p-1.5 text-[var(--color-muted)] transition-colors hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed text-[var(--color-stardust)]">{paragraph}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((t) => (
            <span
              key={t}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-[var(--color-stardust)]"
            >
              {t}
            </span>
          ))}
        </div>

        {landed ? (
          <>
            {blocked && project && (
              <p className="mt-3 text-xs text-[var(--color-gold)]">
                Tu navegador bloqueó la pestaña. Pulsa el botón para abrir la web.
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              {project ? (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-nebula)] to-[var(--color-magenta)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.04]"
                >
                  Abrir la web ↗
                </a>
              ) : (
                <a
                  href="/#sobre-mi"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-nebula)] to-[var(--color-magenta)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.04]"
                >
                  Leer todo sobre mí →
                </a>
              )}
              <button
                onClick={onClose}
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                Seguir explorando
              </button>
            </div>
          </>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span aria-hidden="true">🛸</span>
            {project
              ? 'Haz clic en el planeta para volar y abrir su web'
              : 'Haz clic en el planeta para volar hasta aquí'}
          </p>
        )}
      </div>
    </div>
  );
}
