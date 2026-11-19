import { useSearchParams } from "react-router-dom";
import GlobeView from "@/components/globe/GlobeView";

/** Pantalla principal para explorar registros SATCAT y NEO en el globo. */
export default function Explorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedObjectKey = searchParams.get("object");

  const selectObject = (object) => {
    setSearchParams({ object: object.key }, { replace: true });
  };

  const closeDetails = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <section className="mx-auto max-w-[1800px]">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">Explorador espacial</p>
        <h1 className="mt-2 text-2xl font-semibold text-astro-text">Globo orbital</h1>
        <p className="mt-2 text-sm text-astro-muted">
          Explora registros del catálogo SATCAT y de objetos cercanos a la Tierra.
        </p>
      </div>
      <GlobeView
        onObjectSelect={selectObject}
        onSelectionClose={closeDetails}
        selectedObjectKey={selectedObjectKey}
      />
    </section>
  );
}
