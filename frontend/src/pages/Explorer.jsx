import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import GlobeView from "@/components/globe/GlobeView";
import ObjectDetailsPanel from "@/components/globe/ObjectDetailsPanel";
import { MOCK_GLOBE_OBJECTS } from "@/utils/constants";

/** Pantalla principal para explorar objetos orbitales en el globo 3D. */
export default function Explorer() {
  const [selectedObject, setSelectedObject] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const objectQuery = searchParams.get("object");
    if (!objectQuery) return;
    const object = MOCK_GLOBE_OBJECTS.find(
      (candidate) =>
        candidate.name.toLowerCase() === objectQuery.toLowerCase() ||
        candidate.id === objectQuery,
    );
    if (object) setSelectedObject(object);
  }, [searchParams]);

  return (
    <section className="mx-auto max-w-[1800px]">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">Explorador espacial</p>
        <h1 className="mt-2 text-2xl font-semibold text-astro-text">Globo orbital en tiempo real</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,7fr)_minmax(260px,3fr)]">
        <GlobeView onObjectSelect={setSelectedObject} />
        <ObjectDetailsPanel object={selectedObject} />
      </div>
    </section>
  );
}
