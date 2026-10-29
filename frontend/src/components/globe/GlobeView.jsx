import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ZoomControls from "@/components/ui/ZoomControls";
import { GLOBE_PALETTE, MOCK_GLOBE_OBJECTS, ORBIT_LINES } from "@/utils/constants";

/** Convierte cada órbita en segmentos compatibles con los arcos del globo. */
function orbitSegments() {
  return ORBIT_LINES.flatMap((orbit) =>
    orbit.coordinates.slice(0, -1).map((point, index) => ({
      startLat: point.lat,
      startLng: point.lng,
      endLat: orbit.coordinates[index + 1].lat,
      endLng: orbit.coordinates[index + 1].lng,
    })),
  );
}

/** Renderiza el globo interactivo con objetos, órbitas y alertas. */
export default function GlobeView({ onObjectSelect }) {
  const globeRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 620 });
  const [isLoading, setIsLoading] = useState(true);

  const pointsData = useMemo(() => MOCK_GLOBE_OBJECTS, []);
  const arcsData = useMemo(orbitSegments, []);
  const ringsData = useMemo(
    () => pointsData.filter((object) => object.type === "NEO" && object.hazardous),
    [pointsData],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateDimensions = () => {
      const { width, height } = container.getBoundingClientRect();
      setDimensions({ width: Math.max(280, width), height: Math.max(420, height) });
    };
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);
    updateDimensions();
    return () => observer.disconnect();
  }, []);

  const changeZoom = (factor) => {
    const camera = globeRef.current?.camera();
    if (!camera) return;
    camera.position.z = Math.min(500, Math.max(120, camera.position.z * factor));
  };

  return (
    <div ref={containerRef} className="relative h-[min(70vh,680px)] min-h-[420px] w-full overflow-hidden rounded-xl border border-astro-card bg-astro-bg">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-astro-bg">
          <LoadingSpinner label="Cargando globo 3D..." />
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
        pointColor={(object) => (object.hazardous ? GLOBE_PALETTE.hazardous : GLOBE_PALETTE.safe)}
        pointRadius={0.15}
        pointsMerge
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
        onPointClick={onObjectSelect}
        onGlobeReady={() => setIsLoading(false)}
      />
      <ZoomControls onZoomIn={() => changeZoom(0.8)} onZoomOut={() => changeZoom(1.25)} />
    </div>
  );
}
