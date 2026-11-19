import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import ErrorState from "@/components/ui/ErrorState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ZoomControls from "@/components/ui/ZoomControls";
import ObjectDetailsPanel from "@/components/globe/ObjectDetailsPanel";
import useFetch from "@/hooks/useFetch";
import { getGlobeObjects } from "@/services/globeService";
import { GLOBE_PALETTE, ORBIT_LINES } from "@/utils/constants";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);

/** Renderiza objetos del catálogo real con coordenadas de visualización aproximadas. */
export default function GlobeView({
  onObjectSelect,
  onSelectionClose,
  selectedObjectKey,
}) {
  const globeRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const fetchObjects = useCallback(() => getGlobeObjects(), []);
  const { data, loading, error, refetch } = useFetch(fetchObjects, []);
  const pointsData = data ?? [];
  const arcsData = useMemo(() => ORBIT_LINES, []);
  const ringsData = useMemo(
    () => pointsData.filter((object) => object.type === "NEO" && object.hazardous),
    [pointsData],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateDimensions = () => {
      const bounds = container.getBoundingClientRect();
      const next = {
        width: Math.max(1, Math.floor(bounds.width)),
        height: Math.max(1, Math.floor(bounds.height)),
      };
      setDimensions((current) =>
        current.width === next.width && current.height === next.height ? current : next,
      );
    };

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateDimensions)
      : null;
    observer?.observe(container);
    window.addEventListener("resize", updateDimensions);
    updateDimensions();

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (!selectedObjectKey) {
      setSelectedObject(null);
      return;
    }
    const match = pointsData.find(
      (object) => object.key === selectedObjectKey || object.id === selectedObjectKey,
    );
    setSelectedObject(match ?? null);
  }, [pointsData, selectedObjectKey]);

  const changeZoom = (factor) => {
    const camera = globeRef.current?.camera();
    if (!camera) return;
    camera.position.z = Math.min(500, Math.max(120, camera.position.z * factor));
  };

  const handlePointClick = (object) => {
    setSelectedObject(object);
    onObjectSelect?.(object);
  };

  const closeDetails = () => {
    setSelectedObject(null);
    onSelectionClose?.();
  };

  const pointLabel = (object) =>
    `<div><strong>${escapeHtml(object.name)}</strong><br/>${escapeHtml(object.type)} · ${escapeHtml(object.id)}</div>`;

  return (
    <div className="w-full space-y-3">
      <div
        className="relative h-[400px] w-full overflow-hidden rounded-xl border border-astro-card bg-astro-bg md:h-[600px]"
        ref={containerRef}
      >
        {(loading || (!isGlobeReady && !error)) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-astro-bg">
            <LoadingSpinner label={loading ? "Cargando catálogos orbitales..." : "Cargando globo 3D..."} />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-astro-bg/95 p-4">
            <ErrorState error={error} onRetry={refetch} />
          </div>
        )}
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor={GLOBE_PALETTE.background}
          atmosphereColor={GLOBE_PALETTE.atmosphere}
          atmosphereAltitude={0.15}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointAltitude="altitude"
          pointColor="color"
          pointRadius="size"
          pointLabel={pointLabel}
          arcsData={arcsData}
          arcColor={() => GLOBE_PALETTE.orbit}
          arcDashLength={0.35}
          arcDashGap={0.12}
          arcDashAnimateTime={2400}
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => GLOBE_PALETTE.hazardous}
          ringMaxRadius={3}
          ringPropagationSpeed={2}
          ringRepeatPeriod={1000}
          onPointClick={handlePointClick}
          onGlobeReady={() => setIsGlobeReady(true)}
        />
        <ZoomControls onZoomIn={() => changeZoom(0.8)} onZoomOut={() => changeZoom(1.25)} />
        <p className="absolute bottom-3 right-3 z-10 rounded-md bg-astro-bg/75 px-2 py-1 text-[10px] text-astro-muted backdrop-blur">
          Posiciones de visualización aproximadas · datos de catálogo
        </p>
      </div>
      {selectedObject
        ? <ObjectDetailsPanel object={selectedObject} onClose={closeDetails} />
        : <p className="rounded-lg border border-astro-card bg-astro-card/60 px-4 py-3 text-center text-xs text-astro-muted">
          Selecciona un punto para consultar su registro del catálogo.
        </p>}
    </div>
  );
}
