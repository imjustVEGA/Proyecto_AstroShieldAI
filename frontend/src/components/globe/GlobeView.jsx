// Visor orbital 3D (react-globe.gl + three.js), portado del visor CesiumJS de Astroshield AI.
//
// Qué dibuja (siempre con datos reales; lo que es ilustrativo se rotula como tal):
// · La Tierra en el centro. Vista inicial limpia: sin capas ni trayectorias hasta que se elige un objeto.
// · Objetos seleccionados (`objects`):
//   - SATCAT: órbita esquemática con tamaño, forma e inclinación reales. La orientación (RAAN, ω)
//     y la posición NO están en el dataset: se fija RAAN = ω = 0 y el marcador señala el perigeo.
//   - NEO: el dataset no trae elementos orbitales ni fechas, así que NO hay trayectoria. Se dibuja
//     la distancia mínima de aproximación registrada (real, a escala) como un anillo alrededor de la
//     Tierra, con la órbita de la Luna como referencia. La dirección del marcador es ilustrativa.
// · Capas opcionales: referencia GEO y densidad por altitud (agregados reales de SATCAT).
import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { Check, Crosshair, Layers, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";

import { Skeleton } from "@/components/ui/primitives";
import { useAccessibility } from "@/context/AccessibilityContext";
import { cn } from "@/utils/cn";
import { EARTH_TEXTURE_URL } from "@/utils/constants";
import { formatNumber } from "@/utils/format";
import { GEO_ALTITUDE_KM, schematicOrbitPoints, toGeo } from "@/utils/orbit";
import { DEFAULT_LAYERS, drawnObjects, EARTH_RADIUS_KM, MOON_DISTANCE_KM, objectExtentKm, showsMoon } from "./layers";

const MAX_DRAWN_ALTITUDE_KM = 60_000; // la banda "> GEO" se dibuja a una altitud representativa
const HOME = { lat: 18, lng: -80 };
const HOME_ALTITUDE = 2.3; // en radios terrestres sobre la superficie: la Tierra ocupa buena parte de la vista
const MAX_ALTITUDE = 80_000; // ~200 LD, suficiente para el NEO más lejano del dataset
const ATTENTION_COLOR = { A: "#f87171", B: "#fbbf24" };


const LAYER_OPTIONS = [
  { id: "trajectories", label: "Órbitas y distancias", hint: "De los objetos seleccionados" },
  { id: "references", label: "Referencias", hint: "Anillo geoestacionario (GEO) y órbita de la Luna" },
  { id: "shells", label: "Densidad por altitud", hint: "Capas con los objetos de SATCAT agrupados" },
];

/** "#rrggbb" → "r g b" para la variable CSS del marcador. */
const rgbChannels = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
const withAlpha = (hex, alpha) => `rgba(${rgbChannels(hex).split(" ").join(",")},${alpha})`;

/** Esfera translúcida con pocas líneas guía (ecuador y 4 meridianos) para no saturar la vista. */
function createShell(radius, color, fillOpacity, lineOpacity) {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: fillOpacity, depthWrite: false }),
  ));
  const vertices = [];
  const push = (lat, lng) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (90 - lng) * (Math.PI / 180);
    vertices.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
  };
  for (let lng = -180; lng < 180; lng += 4) { push(0, lng); push(0, lng + 4); }
  for (let s = 0; s < 4; s++) {
    const lng = s * 45;
    for (let lat = -90; lat < 90; lat += 4) { push(lat, lng); push(lat + 4, lng); }
  }
  group.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: lineOpacity, depthWrite: false }),
  ));
  return group;
}

/**
 * Indicador de la Tierra de tamaño constante en pantalla. Al alejarse para ver un NEO lejano la
 * Tierra mide menos de un píxel; este punto marca dónde está. De cerca queda oculto dentro del globo.
 */
function createEarthMarker() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
  gradient.addColorStop(0, "rgba(150,200,255,1)");
  gradient.addColorStop(0.4, "rgba(59,130,246,0.95)");
  gradient.addColorStop(1, "rgba(59,130,246,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "600 26px Manrope, sans-serif";
  ctx.fillStyle = "rgba(232,238,249,0.95)";
  ctx.textBaseline = "middle";
  ctx.fillText("Tierra", 66, 33);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, transparent: true, depthWrite: false }));
  sprite.center.set(32 / 256, 0.5); // el punto (no el centro del rótulo) queda sobre la Tierra
  sprite.scale.set(0.16, 0.04, 1);
  sprite.renderOrder = 2;
  return sprite;
}

function circlePoints(radiusKm, steps = 180) {
  const alt = radiusKm / EARTH_RADIUS_KM - 1;
  const points = [];
  for (let i = 0; i <= steps; i++) points.push([0, -180 + (360 * i) / steps, alt]);
  return points;
}

/** Punto de vista que encuadra uno o varios objetos (la cámara siempre mira al centro de la Tierra). */
function viewFor(list, aspect) {
  if (!list.length) return { ...HOME, altitude: HOME_ALTITUDE };
  const extent = Math.max(...list.map(objectExtentKm)) / EARTH_RADIUS_KM;
  const halfFov = Math.tan((25 * Math.PI) / 180) * Math.min(1, aspect || 1);
  const distance = (1.3 * extent) / halfFov;
  const anchor = list.find((o) => o.approachKm) ?? list[0];
  const lng = anchor.approachKm ? anchor.angleDeg ?? 0 : 0;
  return { lat: anchor.approachKm ? 35 : 22, lng, altitude: Math.min(MAX_ALTITUDE, Math.max(1.2, distance - 1)) };
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
        <div role="alert" className="grid h-full place-items-center p-6 text-center text-[0.8125rem] text-muted-foreground">
          No se pudo iniciar el globo 3D (WebGL no disponible en este navegador). La lista y las fichas siguen funcionando.
        </div>
      );
    }
    return this.props.children;
  }
}

function GlobeCanvas({
  bands, visibleIds, selectedBandId, objects, layers, autoRotate, reducedMotion, onReady, onObjectClick, globeRef, size,
}) {
  const active = objects.find((o) => o.active);
  const drawn = useMemo(() => drawnObjects(objects), [objects]);
  const showMoon = showsMoon(objects, layers);

  const custom = useMemo(() => {
    const list = [{ id: "earth-marker", kind: "earth" }];
    if (!layers.shells) return list;
    const maxCount = Math.max(1, ...bands.map((b) => b.count));
    return list.concat(bands
      .filter((b) => b.count > 0 && (!visibleIds || visibleIds.has(b.id)))
      .map((b) => ({
        ...b,
        kind: "shell",
        altitudeKm: Math.min((b.min_km + b.max_km) / 2, MAX_DRAWN_ALTITUDE_KM),
        density: Math.log10(b.count + 1) / Math.log10(maxCount + 1),
        selected: b.id === selectedBandId,
      })));
  }, [bands, visibleIds, selectedBandId, layers.shells]);

  const paths = useMemo(() => {
    const list = [];
    if (layers.references) {
      list.push({ id: "geo", kind: "geo", points: circlePoints(EARTH_RADIUS_KM + GEO_ALTITUDE_KM), label: "Referencia: órbita geoestacionaria (35.786 km)" });
    }
    if (showMoon) {
      list.push({ id: "moon", kind: "moon", points: circlePoints(MOON_DISTANCE_KM, 240), label: "Referencia: distancia media a la Luna (1 LD = 384.399 km)" });
    }
    if (!layers.trajectories) return list;
    drawn.forEach((o) => {
      if (o.orbit) {
        const { points } = schematicOrbitPoints(o.orbit, 360);
        const geo = points.map((p) => { const g = toGeo(p); return [g.lat, g.lng, g.alt]; });
        list.push({ id: `${o.key}-orbit`, kind: "orbit", objectKey: o.key, points: geo, color: o.color, active: o.active, dimmed: o.dimmed,
          label: `${o.label} · órbita esquemática (orientación ilustrativa)` });
        if (o.active && !reducedMotion) list.push({ id: `${o.key}-flow`, kind: "flow", objectKey: o.key, points: geo, color: o.color });
      } else if (o.approachKm) {
        list.push({ id: `${o.key}-approach`, kind: "approach", objectKey: o.key, points: circlePoints(o.approachKm, 240),
          color: ATTENTION_COLOR[o.attention] ?? o.color, active: o.active, dimmed: o.dimmed,
          label: `${o.label} · distancia mínima registrada: ${formatNumber(o.approachKm / MOON_DISTANCE_KM, 2)} LD` });
      }
    });
    return list;
  }, [drawn, layers.trajectories, layers.references, showMoon, reducedMotion]);

  const markers = useMemo(() => {
    const list = [];
    drawn.forEach((o) => {
      if (o.orbit) {
        const { perigee } = schematicOrbitPoints(o.orbit, 4);
        list.push({ ...toGeo(perigee), key: o.key, label: o.label, sublabel: o.sublabel, color: o.color, active: o.active, dimmed: o.dimmed });
      } else if (o.approachKm) {
        list.push({ lat: 0, lng: o.angleDeg ?? 0, alt: o.approachKm / EARTH_RADIUS_KM - 1, key: o.key, label: o.label,
          sublabel: o.sublabel, color: o.color, active: o.active, dimmed: o.dimmed, attention: o.attention });
      }
    });
    const moonReadable = !active || objectExtentKm(active) < MOON_DISTANCE_KM * 4;
    if (showMoon && moonReadable) list.push({ lat: 0, lng: (active?.angleDeg ?? 0) + 150, alt: MOON_DISTANCE_KM / EARTH_RADIUS_KM - 1, key: "ref-moon", label: "Órbita de la Luna", sublabel: "1 LD = 384.399 km", reference: true });
    if (layers.references) list.push({ lat: 0, lng: -130, alt: GEO_ALTITUDE_KM / EARTH_RADIUS_KM, key: "ref-geo", label: "GEO", sublabel: "35.786 km", reference: true });
    return list;
  }, [drawn, layers.references, showMoon, active]);

  const radius = useCallback(() => globeRef.current?.getGlobeRadius?.() ?? 100, [globeRef]);
  const clickRef = useRef(onObjectClick);
  clickRef.current = onObjectClick;
  const clickable = Boolean(onObjectClick);

  const handleReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    // Plano lejano y distancia máxima amplios: los NEO del dataset llegan a ~195 distancias lunares.
    const camera = globe.camera();
    camera.near = 1;
    camera.far = radius() * 1e5;
    camera.updateProjectionMatrix();
    const controls = globe.controls();
    controls.maxDistance = radius() * (MAX_ALTITUDE + 1);
    controls.autoRotateSpeed = 0.35;
    controls.enableDamping = true;
    onReady?.();
  }, [globeRef, onReady, radius]);

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (controls) controls.autoRotate = autoRotate && !reducedMotion;
  }, [autoRotate, reducedMotion, globeRef]);

  // Accesores estables: si cambiaran en cada render, three-globe reconstruiría todos los objetos.
  const customThreeObject = useCallback((d) => (d.kind === "earth" ? createEarthMarker() : createShell(
    radius() * (1 + d.altitudeKm / EARTH_RADIUS_KM),
    d.selected ? "#38bdf8" : "#3b82f6",
    (d.selected ? 0.06 : 0.004) + d.density * 0.018,
    (d.selected ? 0.5 : 0.04) + d.density * 0.12,
  )), [radius]);
  const customThreeObjectUpdate = useCallback((obj) => obj.position.set(0, 0, 0), []);
  const pathLabel = useCallback((d) => d.label ?? "", []);
  const onPathClick = useCallback((d) => d.objectKey && clickRef.current?.(d.objectKey), []);
  const pathColor = useCallback((d) => {
    if (d.kind === "geo") return "rgba(56,189,248,0.45)";
    if (d.kind === "moon") return "rgba(203,213,225,0.45)";
    if (d.kind === "flow") return ["rgba(255,255,255,0)", "#ffffff"];
    return withAlpha(d.color, d.dimmed ? 0.35 : 0.95);
  }, []);
  const pathStroke = useCallback((d) => ({ orbit: d.active ? 2.6 : 1.4, approach: d.active ? 2.2 : 1.2, flow: 3.2, moon: 1, geo: 1.2 }[d.kind] ?? 1), []);
  const pathDashLength = useCallback((d) => ({ flow: 0.12, approach: 0.012, moon: 0.006 }[d.kind] ?? 1), []);
  const pathDashGap = useCallback((d) => ({ flow: 0.88, approach: 0.008, moon: 0.01 }[d.kind] ?? 0), []);
  const pathDashAnimateTime = useCallback((d) => (d.kind === "flow" ? 7000 : 0), []);
  const htmlElement = useCallback((d) => {
    const el = document.createElement("div");
    el.className = cn("astro-globe-marker", d.dimmed && "is-dimmed", d.reference && "is-reference", !d.reference && clickable && "is-clickable");
    if (d.color) el.style.setProperty("--marker", rgbChannels(d.color));
    if (d.attention) el.dataset.attention = d.attention;
    el.innerHTML = d.reference ? `<span class="tag"><b></b><small></small></span>` : `<span class="dot"></span><span class="tag"><b></b><small></small></span>`;
    el.querySelector("b").textContent = d.label;
    el.querySelector("small").textContent = d.sublabel ?? "";
    if (d.dimmed) el.querySelector(".tag").style.display = "none";
    if (!d.reference && clickable) {
      el.title = `${d.label}: ver su información`;
      el.addEventListener("click", () => clickRef.current?.(d.key));
    }
    return el;
  }, [clickable]);

  return (
    <Globe
      ref={globeRef}
      width={size.width}
      height={size.height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl={EARTH_TEXTURE_URL}
      showAtmosphere
      atmosphereColor="#3b82f6"
      atmosphereAltitude={0.16}
      onGlobeReady={handleReady}
      // Capas por altitud + indicador de la Tierra
      customLayerData={custom}
      customThreeObject={customThreeObject}
      customThreeObjectUpdate={customThreeObjectUpdate}
      // Órbitas, anillos de aproximación y referencias
      pathsData={paths}
      pathPoints="points"
      pathPointLat={pathLat}
      pathPointLng={pathLng}
      pathPointAlt={pathAlt}
      pathResolution={1}
      pathLabel={pathLabel}
      onPathClick={onPathClick}
      pathColor={pathColor}
      pathStroke={pathStroke}
      pathDashLength={pathDashLength}
      pathDashGap={pathDashGap}
      pathDashAnimateTime={pathDashAnimateTime}
      pathTransitionDuration={0}
      // Marcadores (perigeo de satélites, posición ilustrativa de NEO, rótulos de referencia)
      htmlElementsData={markers}
      htmlLat="lat"
      htmlLng="lng"
      htmlAltitude="alt"
      htmlTransitionDuration={0}
      htmlElement={htmlElement}
    />
  );
}

const pathLat = (p) => p[0];
const pathLng = (p) => p[1];
const pathAlt = (p) => p[2];

/**
 * bands: capas de /visualization/orbital-shells.
 * objects: [{ key, kind: "satcat"|"neo", label, sublabel, color, orbit?, approachKm?, angleDeg?, attention?, active?, dimmed? }].
 * orbit: atajo para una sola órbita esquemática { apogeeKm, perigeeKm, inclinationDeg, label, sublabel } (Simulación).
 * focusKey + focusNonce: al cambiar, la cámara encuadra ese objeto (o todos los seleccionados si focusKey es null).
 */
export default function GlobeView({
  bands = [], visibleIds, selectedBandId, objects: objectsProp, orbit, focusKey = null, focusNonce = 0,
  layers: layersProp, onLayersChange, defaultLayers, onObjectClick,
  cameraAltitudeKm, autoRotate = false, title = "Entorno espacial", footer, overlay, overlayInset = 0, emptyHint, className, ariaLabel,
}) {
  const frame = useRef(null);
  const container = useRef(null);
  const globeRef = useRef(null);
  const { reducedMotion } = useAccessibility();
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [ready, setReady] = useState(false);
  const [rotating, setRotating] = useState(autoRotate);
  const [layersOpen, setLayersOpen] = useState(false);
  const [innerLayers, setInnerLayers] = useState(() => ({ ...DEFAULT_LAYERS, ...defaultLayers }));
  const layers = layersProp ?? innerLayers;
  const setLayer = (id, value) => {
    const next = { ...layers, [id]: value };
    if (onLayersChange) onLayersChange(next);
    else setInnerLayers(next);
  };

  // Una sola órbita (Simulación) se trata como un objeto seleccionado más.
  const objects = useMemo(() => {
    if (objectsProp) return objectsProp;
    if (!orbit) return [];
    return [{ key: "orbit", kind: "satcat", label: orbit.label, sublabel: orbit.sublabel, color: "#60a5fa", orbit, active: true }];
  }, [objectsProp, orbit]);

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

  const transition = reducedMotion ? 0 : 900;
  // Si la ficha del objeto ocupa la derecha del mapa, el centro de la escena (la Tierra) se desplaza
  // a la izquierda con un "view offset" de la cámara: nada queda escondido detrás de la ficha.
  const inset = Math.max(0, Math.min(size.width * 0.5, overlayInset));
  useEffect(() => {
    const camera = globeRef.current?.camera?.();
    if (!ready || !camera) return;
    const shift = Math.round(inset / 2);
    if (shift > 0) camera.setViewOffset(size.width + 2 * shift, size.height, 2 * shift, 0, size.width, size.height);
    else {
      camera.clearViewOffset();
      camera.aspect = size.width / Math.max(1, size.height);
    }
    camera.updateProjectionMatrix();
  }, [ready, inset, size.width, size.height]);

  /** Encuadra el objeto pedido, todos los seleccionados o la vista inicial. */
  const frameView = useCallback((key, ms = transition) => {
    const globe = globeRef.current;
    if (!globe) return;
    const target = key ? objects.filter((o) => o.key === key) : objects;
    let view = viewFor(target, (size.width - inset) / Math.max(1, size.height));
    // Simulación: respeta la altitud de cámara pedida por la página.
    if (!objectsProp && cameraAltitudeKm) view = { ...view, altitude: cameraAltitudeKm / EARTH_RADIUS_KM };
    globe.pointOfView(view, ms);
  }, [objects, objectsProp, cameraAltitudeKm, transition, inset, size.width, size.height]);

  // Encuadre inicial y cada vez que la página pide enfocar otro objeto.
  // También al cambiar mucho el tamaño del visor (p. ej. otra distribución o el tamaño de texto).
  const objectSignature = objects.map((o) => o.key).join("|");
  const sizeBucket = `${Math.round(size.width / 80)}x${Math.round(size.height / 80)}`;
  useEffect(() => {
    if (ready && size.width > 1) frameView(focusKey, transition);
  }, [ready, focusKey, focusNonce, objectSignature, cameraAltitudeKm, sizeBucket, Math.round(inset / 40)]); // eslint-disable-line react-hooks/exhaustive-deps

  const zoom = (factor) => {
    const globe = globeRef.current;
    if (!globe) return;
    const pov = globe.pointOfView();
    globe.pointOfView({ ...pov, altitude: Math.min(MAX_ALTITUDE, Math.max(0.3, pov.altitude * factor)) }, reducedMotion ? 0 : 400);
  };
  const rotate = (dLat, dLng) => {
    const globe = globeRef.current;
    if (!globe) return;
    const pov = globe.pointOfView();
    globe.pointOfView({ ...pov, lat: Math.max(-85, Math.min(85, pov.lat + dLat)), lng: pov.lng + dLng }, reducedMotion ? 0 : 300);
  };

  /** Teclado con el mapa enfocado: flechas giran, + y − acercan o alejan, 0 restablece. */
  const onKeyDown = (event) => {
    const actions = {
      ArrowLeft: () => rotate(0, -15), ArrowRight: () => rotate(0, 15), ArrowUp: () => rotate(10, 0), ArrowDown: () => rotate(-10, 0),
      "+": () => zoom(0.7), "=": () => zoom(0.7), "-": () => zoom(1.45), _: () => zoom(1.45), 0: () => frameView(focusKey),
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  const controls = [
    { icon: Plus, label: "Acercar (tecla +)", onClick: () => zoom(0.65) },
    { icon: Minus, label: "Alejar (tecla −)", onClick: () => zoom(1.5) },
    objects.length > 0
      ? { icon: Crosshair, label: "Encuadrar la selección (tecla 0)", onClick: () => frameView(focusKey) }
      : { icon: RotateCcw, label: "Restablecer vista (tecla 0)", onClick: () => frameView(null) },
  ];

  const description = ariaLabel ?? (objects.length
    ? `Mapa 3D de la Tierra con ${objects.length} objeto${objects.length === 1 ? "" : "s"}: ${objects.map((o) => o.label).join(", ")}.`
    : "Mapa 3D de la Tierra sin objetos seleccionados.");

  return (
    <div ref={frame} className={cn("starfield relative h-full w-full overflow-hidden rounded-[inherit]", className)}>
      <div
        ref={container}
        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        data-testid="globe"
        role="application"
        aria-roledescription="mapa 3D"
        aria-label={`${description} Usa las flechas para girar y las teclas + y − para acercar o alejar.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <GlobeBoundary>
          <GlobeCanvas bands={bands} visibleIds={visibleIds} selectedBandId={selectedBandId} objects={objects} layers={layers}
            autoRotate={rotating} reducedMotion={reducedMotion} onReady={() => setReady(true)} onObjectClick={onObjectClick}
            globeRef={globeRef} size={size} />
        </GlobeBoundary>
      </div>
      {!ready && <Skeleton className="absolute inset-0 rounded-none bg-secondary/30" />}

      <div className="pointer-events-none absolute left-4 top-3 max-w-[60%]">
        <p className="eyebrow flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Vista orbital</p>
        <p className="mt-0.5 truncate text-[0.875rem]"><span className="text-muted-foreground">Tierra /</span> {title}</p>
      </div>

      {objects.length === 0 && emptyHint && ready && (
        <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center px-4">
          <p className="max-w-sm rounded-md border bg-card/85 px-3 py-2 text-center text-[0.8125rem] text-secondary-foreground backdrop-blur">{emptyHint}</p>
        </div>
      )}

      {overlay}

      <button
        type="button"
        aria-label="Pantalla completa"
        title="Pantalla completa"
        onClick={() => (document.fullscreenElement ? document.exitFullscreen() : frame.current?.requestFullscreen?.())}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-md border bg-card/70 text-secondary-foreground backdrop-blur hover:bg-secondary hover:text-foreground"
      >
        <Maximize2 className="size-4" />
      </button>

      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
        {layersOpen && (
          <div role="group" aria-label="Capas del mapa" className="w-64 rounded-lg border bg-popover/95 p-2 shadow-2xl backdrop-blur">
            {LAYER_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-secondary">
                <input type="checkbox" className="mt-1 size-4 accent-blue-500" checked={Boolean(layers[opt.id])} onChange={(e) => setLayer(opt.id, e.target.checked)} />
                <span>
                  <span className="block text-[0.8125rem] font-medium">{opt.label}</span>
                  <span className="block text-[0.75rem] text-muted-foreground">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-1 rounded-lg border bg-card/85 p-1 backdrop-blur">
          {controls.map(({ icon: Icon, label, onClick }) => (
            <button key={label} type="button" aria-label={label} title={label} onClick={onClick}
              className="grid size-9 place-items-center rounded-md text-secondary-foreground hover:bg-secondary hover:text-foreground">
              <Icon className="size-4" />
            </button>
          ))}
          <button type="button" aria-label="Capas del mapa" title="Capas del mapa" aria-expanded={layersOpen} onClick={() => setLayersOpen((o) => !o)}
            className={cn("relative grid size-9 place-items-center rounded-md text-secondary-foreground hover:bg-secondary hover:text-foreground", layersOpen && "bg-secondary text-foreground")}>
            <Layers className="size-4" />
            {(layers.shells || layers.references) && <Check className="absolute bottom-0.5 right-0.5 size-3 text-accent" aria-hidden />}
          </button>
          {!reducedMotion && (
            <button type="button" title={rotating ? "Detener rotación" : "Rotar automáticamente"} aria-label={rotating ? "Detener rotación" : "Rotar automáticamente"}
              aria-pressed={rotating} onClick={() => setRotating((r) => !r)}
              className={cn("grid h-9 place-items-center rounded-md px-1.5 text-[0.6875rem] font-semibold text-secondary-foreground hover:bg-secondary",
                rotating && "bg-primary/20 text-blue-100")}>
              360°
            </button>
          )}
        </div>
      </div>

      {footer && <div className="pointer-events-none absolute bottom-3 left-4 right-56 flex flex-wrap items-end gap-2 text-[0.75rem] [&_a]:pointer-events-auto">{footer}</div>}
    </div>
  );
}
