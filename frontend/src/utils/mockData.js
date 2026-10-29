/** Datos simulados para las pantallas de objetos cercanos y satélites. */
const neoNames = [
  "Bennu", "Ganymed", "Icarus", "Apolo", "Eros", "Ryugu", "Itokawa",
  "Toutatis", "Hathor", "Amor", "Aten", "Orpheus", "Didymos", "Dionysus",
];

export const MOCK_NEOS = Array.from({ length: 50 }, (_, index) => {
  const isHazardous = index % 4 === 0 || index === 1;
  return {
    id: `NEO-${1000 + index}`,
    name: index < neoNames.length ? neoNames[index] : `${neoNames[index % neoNames.length]}-${index}`,
    diameter: Number((0.18 + ((index * 37) % 920) / 100).toFixed(2)),
    velocity: 18000 + ((index * 7913) % 42000),
    approachDate: `2026-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}`,
    isHazardous,
    probability: isHazardous ? 55 + ((index * 13) % 46) : 2 + ((index * 11) % 42),
  };
});

const satelliteNames = [
  "ISS (ZARYA)", "STARLINK-1007", "HUBBLE", "GPS BIIR-2", "GOES-16",
  "TIANGONG", "NOAA-20", "SENTINEL-2A", "ONEWEB-0123", "IRIDIUM-145",
];
const satelliteTypes = ["Estación Espacial", "Satélite de Comunicaciones", "Satélite de Observación", "Escombro"];
const orbits = ["LEO", "MEO", "GEO", "HEO"];
const statuses = ["Activo", "Inactivo", "Escombro"];

export const MOCK_SATCAT = Array.from({ length: 50 }, (_, index) => ({
  id: `SAT-${index + 1}`,
  norad: String(25544 + index * 731),
  name: index < satelliteNames.length ? satelliteNames[index] : `${satelliteNames[index % satelliteNames.length]}-${index}`,
  type: satelliteTypes[index % satelliteTypes.length],
  orbit: orbits[index % orbits.length],
  inclination: Number((1.5 + ((index * 7.3) % 97)).toFixed(1)),
  apogee: 420 + ((index * 1837) % 35700),
  perigee: 380 + ((index * 1279) % 24100),
  status: statuses[index % statuses.length],
}));

const neoHazardousCount = MOCK_NEOS.filter((neo) => neo.isHazardous).length;
const averageVelocity = MOCK_NEOS.reduce((sum, neo) => sum + neo.velocity, 0) / MOCK_NEOS.length;

export const MOCK_CHART_DATA = {
  neoClassification: [
    { name: "Peligrosos", value: neoHazardousCount },
    { name: "No peligrosos", value: MOCK_NEOS.length - neoHazardousCount },
  ],
  neoDiameters: [...MOCK_NEOS].sort((a, b) => b.diameter - a.diameter).slice(0, 5).map((neo) => ({ name: neo.name, value: neo.diameter })),
  neoVelocities: [...MOCK_NEOS].sort((a, b) => b.velocity - a.velocity).slice(0, 5).map((neo) => ({ name: neo.name, value: Math.round(neo.velocity / 1000) })),
  neoScatter: MOCK_NEOS.map((neo, index) => ({ distance: 0.18 + ((index * 19) % 740) / 100, diameter: neo.diameter, name: neo.name })),
  satcatTypes: satelliteTypes.map((type) => ({ name: type.replace("Satélite de ", ""), value: MOCK_SATCAT.filter((satellite) => satellite.type === type).length })),
  launchesByYear: [2022, 2023, 2024, 2025, 2026].map((year, index) => ({ name: String(year), value: 8 + index * 5 })),
  orbitComparison: orbits.map((orbit) => {
    const satellites = MOCK_SATCAT.filter((satellite) => satellite.orbit === orbit);
    return {
      name: orbit,
      apogee: Math.round(satellites.reduce((sum, satellite) => sum + satellite.apogee, 0) / satellites.length),
      perigee: Math.round(satellites.reduce((sum, satellite) => sum + satellite.perigee, 0) / satellites.length),
    };
  }),
  inclination: orbits.map((orbit) => {
    const satellites = MOCK_SATCAT.filter((satellite) => satellite.orbit === orbit);
    return {
      name: orbit,
      value: Number((satellites.reduce((sum, satellite) => sum + satellite.inclination, 0) / satellites.length).toFixed(1)),
    };
  }),
  averageVelocity,
};
