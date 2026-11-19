import { getNeos } from "@/services/neoService";
import { getSatcat } from "@/services/satcatService";
import { GLOBE_PALETTE } from "@/utils/constants";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function visualCoordinates(key) {
  let hash = 2166136261;
  for (const character of key) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  const secondHash = Math.imul(hash ^ 0x9e3779b9, 2246822519) >>> 0;
  return {
    lat: (secondHash % 16000) / 100 - 80,
    lng: (hash % 36000) / 100 - 180,
  };
}

function createSatcatPoint(satellite) {
  const id = String(satellite.norad);
  const key = `SATCAT-${id}`;
  const apogee = toNumber(satellite.apogee);
  return {
    ...satellite,
    ...visualCoordinates(key),
    key,
    id,
    type: "SATCAT",
    catalogType: satellite.type,
    hazardous: false,
    altitude: Math.min(0.35, Math.max(0.02, apogee / 100000)),
    size: satellite.type === "Debris" ? 0.055 : 0.08,
    color: GLOBE_PALETTE.safe,
  };
}

function createNeoPoint(neo) {
  const key = `NEO-${neo.id}`;
  return {
    ...neo,
    ...visualCoordinates(key),
    key,
    type: "NEO",
    catalogType: "Asteroide cercano",
    hazardous: neo.isHazardous,
    altitude: 0.08,
    size: Math.min(0.22, 0.06 + Math.log10(1 + neo.diameter) * 0.04),
    color: neo.isHazardous ? GLOBE_PALETTE.hazardous : GLOBE_PALETTE.safe,
  };
}

export async function getGlobeObjects() {
  const [satcat, neos] = await Promise.all([
    getSatcat(1, 100),
    getNeos(1, 100),
  ]);
  return [
    ...satcat.items.map(createSatcatPoint),
    ...neos.items.map(createNeoPoint),
  ];
}
