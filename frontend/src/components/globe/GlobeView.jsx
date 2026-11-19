// Visor orbital 3D (react-globe.gl + three.js), portado del visor CesiumJS de Astroshield AI.
// · Capas agregadas por altitud media (datos reales de SATCAT, representación conceptual).
// · Anillo de referencia en la altitud geoestacionaria.
// · Órbita esquemática del objeto seleccionado: tamaño, forma e inclinación reales;
//   orientación (RAAN, ω) y posición NO disponibles en el dataset, por eso se rotula.
import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { Layers, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";

import { Skeleton } from "@/components/ui/primitives";
import { cn } from "@/utils/cn";
import { EARTH_TEXTURE_URL } from "@/utils/constants";
import { GEO_ALTITUDE_KM, schematicOrbitPoints, toGeo } from "@/utils/orbit";

const EARTH_RADIUS_KM = 6371; // radio que usa three-globe para convertir altitudes
const MAX_DRAWN_ALTITUDE_KM = 60_000; // la banda "> GEO" se dibuja a una altitud representativa
const HOME = { lat: 15, lng: -75 };

/** Esfera translúcida con meridianos y paralelos (como el contorno del elipsoide en Cesium). */
function createShell(radius, color, fillOpacity, lineOpacity) {
  const group = new THREE.Group();
  const fill = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: fillOpacity, depthWrite: false }),
  );
  group.add(fill);

  const vertices = [];
  const push = (lat, lng) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (90 - lng) * (Math.PI / 180);
    vertices.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
  };
  for (let s = 0; s < 24; s++) {
    const lng = (s / 24) * 360 - 180;
    for (let lat = -90; lat < 90; lat += 6) { push(lat, lng); push(lat + 6, lng); }
  }
  for (let k = 1; k < 14; k++) {
    const lat = (k / 14) * 180 - 90;
    for (let lng = -180; lng < 180; lng += 6) { push(lat, lng); push(lat, lng + 6); }
  }
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: lineOpacity, depthWrite: false }),
  );
  group.add(lines);
  return group;
}

/** Si el navegador no tiene WebGL, se muestra un aviso en lugar de romper la página. */
class GlobeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid h-full place-items-center p-6 text-center text-[12px] text-muted-foreground">
          No se pudo iniciar el globo 3D (WebGL no disponible en este navegador).
        </div>
      );
    }
    return this.props.children;
  }
}

function GlobeCanvas({
  bands, visibleIds, selectedBandId, orbit, cameraAltitudeKm, autoRotate, showShells, onReady, globeRef, size,
}) {
  const shells = useMemo(() => {
    if (!showShells) return [];
    const maxCount = Math.max(1, ...bands.map((b) => b.count));
    return bands
      .filter((b) => b.count > 0 && (!visibleIds || visibleIds.has(b.id)))
      .map((b) => {
        const density = Math.log10(b.count + 1) / Math.log10(maxCount + 1);
        const selected = b.id === selectedBandId;
        const altitudeKm = Math.min((b.min_km + b.max_km) / 2, MAX_DRAWN_ALTITUDE_KM);
        return { ...b, altitudeKm, density, selected };
      });
  }, [bands, visibleIds, selectedBandId, showShells]);

  const paths = useMemo(() => {
    const geoAlt = GEO_ALTITUDE_KM / EARTH_RADIUS_KM;
    const ring = { id: "geo", kind: "geo", points: [] };
    for (let lng = -180; lng <= 180; lng += 3) ring.points.push([0, lng, geoAlt]);
    const list = [ring];
    if (orbit) {
      const { points } = schematicOrbitPoints(orbit, 360);
      const geo = points.map((p) => { const g = toGeo(p); return [g.lat, g.lng, g.alt]; });
      // Trazo continuo de la órbita + un destello animado que la recorre.
      list.push({ id: "orbit", kind: "orbit", points: geo }, { id: "orbit-flow", kind: "flow", points: geo });
    }
    return list;
  }, [orbit]);

  const markers = useMemo(() => {
    if (!orbit) return [];
    const { perigee } = schematicOrbitPoints(orbit, 4);
    return [{ ...toGeo(perigee), label: orbit.label, sublabel: orbit.sublabel }];
  }, [orbit]);

  const radius = () => globeRef.current?.getGlobeRadius?.() ?? 100;

  const handleReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView({ ...HOME, altitude: cameraAltitudeKm / EARTH_RADIUS_KM }, 0);
    const controls = globe.controls();
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.35;
    controls.enableDamping = true;
    onReady?.();
  }, [globeRef, cameraAltitudeKm, autoRotate, onReady]);

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (controls) controls.autoRotate = autoRotate;
  }, [autoRotate, globeRef]);

  return (
    <Globe
      ref={globeRef}
      width={size.width}
      height={size.height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl={EARTH_TEXTURE_URL}
      showAtmosphere
      atmosphereColor="#3b82f6"
      atmosphereAltitude={0.18}
      onGlobeReady={handleReady}
      // Capas por altitud
      customLayerData={shells}
      customThreeObject={(d) => createShell(
        radius() * (1 + d.altitudeKm / EARTH_RADIUS_KM),
        d.selected ? "#38bdf8" : "#3b82f6",
        (d.selected ? 0.07 : 0.004) + d.density * 0.022,
        (d.selected ? 0.45 : 0.025) + d.density * 0.1,
      )}
      customThreeObjectUpdate={(obj) => obj.position.set(0, 0, 0)}
      // Referencia GEO y órbita esquemática
      pathsData={paths}
      pathPoints="points"
      pathPointLat={(p) => p[0]}
      pathPointLng={(p) => p[1]}
      pathPointAlt={(p) => p[2]}
      pathResolution={1}
      pathColor={(d) => ({ orbit: "rgba(124,196,255,0.9)", flow: ["rgba(255,255,255,0)", "#ffffff"] }[d.kind] ?? "rgba(56,189,248,0.45)")}
      pathStroke={(d) => ({ orbit: 2, flow: 3.2 }[d.kind] ?? 1.2)}
      pathDashLength={(d) => (d.kind === "flow" ? 0.12 : 1)}
      pathDashGap={(d) => (d.kind === "flow" ? 0.88 : 0)}
      pathDashAnimateTime={(d) => (d.kind === "flow" ? 7000 : 0)}
      pathTransitionDuration={0}
      // Marcador del perigeo
      htmlElementsData={markers}
      htmlLat="lat"
      htmlLng="lng"
      htmlAltitude="alt"
      htmlElement={(d) => {
        const el = document.createElement("div");
        el.className = "astro-globe-marker";
        el.innerHTML = `<span class="dot"></span><span class="tag"><b></b><small></small></span>`;
        el.querySelector("b").textContent = d.label;
        el.querySelector("small").textContent = d.sublabel ?? "";
        return el;
      }}
    />
  );
}

/**
 * bands: capas de /visualization/orbital-shells · orbit: { apogeeKm, perigeeKm, inclinationDeg, label, sublabel }
 */
export default function GlobeView({
  bands = [], visibleIds, selectedBandId, orbit, cameraAltitudeKm = 95_000, autoRotate = false,
  title = "Entorno espacial", footer, className,
}) {
  const frame = useRef(null);
  const container = useRef(null);
  const globeRef = useRef(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [ready, setReady] = useState(false);
  const [showShells, setShowShells] = useState(true);
  const [rotating, setRotating] = useState(autoRotate);

  useEffect(() => {
    const el = container.current;
    if (!el) return undefined;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (s.width === Math.floor(r.width) && s.height === Math.floor(r.height)
        ? s : { width: Math.max(1, Math.floor(r.width)), height: Math.max(1, Math.floor(r.height)) }));
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, []);

  // Si cambia la altitud de cámara pedida (p. ej. otra órbita en la simulación), se acompaña con la vista.
  useEffect(() => {
    if (!ready) return;
    const globe = globeRef.current;
    const pov = globe?.pointOfView();
    if (pov) globe.pointOfView({ ...pov, altitude: cameraAltitudeKm / EARTH_RADIUS_KM }, 800);
  }, [cameraAltitudeKm, ready]);

  const zoom = (factor) => {
    const globe = globeRef.current;
    if (!globe) return;
    const pov = globe.pointOfView();
    globe.pointOfView({ ...pov, altitude: Math.min(95, Math.max(0.3, pov.altitude * factor)) }, 500);
  };
  const home = () => globeRef.current?.pointOfView({ ...HOME, altitude: cameraAltitudeKm / EARTH_RADIUS_KM }, 800);

  const controls = [
    { icon: Plus, label: "Acercar", onClick: () => zoom(0.65) },
    { icon: Minus, label: "Alejar", onClick: () => zoom(1.5) },
    { icon: RotateCcw, label: "Restablecer vista", onClick: home },
    { icon: Layers, label: showShells ? "Ocultar capas" : "Mostrar capas", onClick: () => setShowShells((s) => !s), active: showShells },
  ];

  return (
    <div ref={frame} className={cn("starfield relative h-full w-full overflow-hidden rounded-[inherit]", className)}>
      <div ref={container} className="absolute inset-0" data-testid="globe">
        <GlobeBoundary>
          <GlobeCanvas bands={bands} visibleIds={visibleIds} selectedBandId={selectedBandId} orbit={orbit}
            cameraAltitudeKm={cameraAltitudeKm} autoRotate={rotating} showShells={showShells}
            onReady={() => setReady(true)} globeRef={globeRef} size={size} />
        </GlobeBoundary>
      </div>
      {!ready && <Skeleton className="absolute inset-0 rounded-none bg-secondary/30" />}

      <div className="pointer-events-none absolute left-5 top-4">
        <p className="eyebrow flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Vista orbital</p>
        <p className="mt-1 text-[13px]"><span className="text-muted-foreground">Tierra</span> <span className="text-muted-foreground/60">/</span> {title}</p>
      </div>

      <button
        type="button"
        aria-label="Pantalla completa"
        onClick={() => (document.fullscreenElement ? document.exitFullscreen() : frame.current?.requestFullscreen?.())}
        className="absolute right-4 top-4 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Maximize2 className="size-4" />
      </button>

      <div className="absolute bottom-14 right-4 flex flex-col gap-0.5 rounded-lg border bg-card/80 p-1 backdrop-blur">
        {controls.map(({ icon: Icon, label, onClick, active }) => (
          <button key={label} type="button" aria-label={label} title={label} onClick={onClick} aria-pressed={active}
            className={cn("grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground",
              active && "text-blue-200")}>
            <Icon className="size-3.5" />
          </button>
        ))}
        <button type="button" title={rotating ? "Detener rotación" : "Rotar"} aria-label={rotating ? "Detener rotación" : "Rotar"}
          aria-pressed={rotating} onClick={() => setRotating((r) => !r)}
          className={cn("grid size-7 place-items-center rounded-md text-[9px] font-semibold text-muted-foreground hover:bg-secondary",
            rotating && "text-blue-200")}>
          360°
        </button>
      </div>

      {footer && <div className="absolute bottom-3 left-5 right-4 flex flex-wrap items-end justify-between gap-2 text-[10px]">{footer}</div>}
    </div>
  );
}
