const fs = require("fs/promises");
const path = require("path");

const OVERPASS_URL =
  process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const OUTPUT_PATH = "public/data/osm/commercial_facilities.geojson";
const SHOP_TYPES = [
  "mall",
  "department_store",
];

const query = `[out:json][timeout:180];
area["ISO3166-2"="JP-12"][boundary=administrative]->.chiba;
(
  node["shop"~"^(${SHOP_TYPES.join("|")})$"](area.chiba);
  way["shop"~"^(${SHOP_TYPES.join("|")})$"](area.chiba);
  relation["shop"~"^(${SHOP_TYPES.join("|")})$"](area.chiba);
);
out body center geom;`;

function getCoordinates(element) {
  if (Number.isFinite(element.lon) && Number.isFinite(element.lat)) {
    return [element.lon, element.lat];
  }

  if (
    Number.isFinite(element.center?.lon) &&
    Number.isFinite(element.center?.lat)
  ) {
    return [element.center.lon, element.center.lat];
  }

  const geometryPoints = getGeometryRings(element).flat();
  if (geometryPoints.length > 0) {
    const latitudes = geometryPoints.map((point) => point.lat);
    const longitudes = geometryPoints.map((point) => point.lon);
    return [
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    ];
  }

  return null;
}

function getGeometryRings(element) {
  if (element.type === "way" && element.geometry) return [element.geometry];
  if (element.type === "relation") {
    return (element.members || [])
      .filter((member) => member.role === "outer" && member.geometry)
      .map((member) => member.geometry);
  }
  return [];
}

function isClosedGeometry(geometry) {
  if (!geometry || geometry.length < 4) return false;
  const first = geometry[0];
  const last = geometry[geometry.length - 1];
  return first.lat === last.lat && first.lon === last.lon;
}

function calculateAreaSqm(geometry) {
  if (!isClosedGeometry(geometry)) return null;

  const earthRadius = 6378137;
  let area = 0;

  for (let index = 0; index < geometry.length - 1; index += 1) {
    const current = geometry[index];
    const next = geometry[index + 1];
    const longitudeDelta = ((next.lon - current.lon) * Math.PI) / 180;
    const currentLatitude = (current.lat * Math.PI) / 180;
    const nextLatitude = (next.lat * Math.PI) / 180;
    area += longitudeDelta * (2 + Math.sin(currentLatitude) + Math.sin(nextLatitude));
  }

  return Math.round(Math.abs((area * earthRadius * earthRadius) / 2));
}

function getPolygonGeometry(element) {
  const rings = getGeometryRings(element).filter(isClosedGeometry);
  if (rings.length === 0) return null;
  const coordinates = rings.map((ring) =>
    ring.map(({ lon, lat }) => [lon, lat])
  );

  if (coordinates.length === 1) {
    return { type: "Polygon", coordinates };
  }

  return {
    type: "MultiPolygon",
    coordinates: coordinates.map((ring) => [ring]),
  };
}

function getElementAreaSqm(element) {
  const areas = getGeometryRings(element)
    .map(calculateAreaSqm)
    .filter(Number.isFinite);
  if (areas.length === 0) return null;
  return areas.reduce((sum, area) => sum + area, 0);
}

function compactProperties(element, center, areaSqm) {
  const tags = element.tags || {};
  const address = [
    tags["addr:province"],
    tags["addr:city"],
    tags["addr:district"],
    tags["addr:suburb"],
    tags["addr:quarter"],
    tags["addr:neighbourhood"],
    tags["addr:block_number"],
    tags["addr:housenumber"],
  ]
    .filter(Boolean)
    .join("");

  return {
    osmType: element.type,
    osmId: element.id,
    center,
    name: tags.name || tags["name:ja"] || "名称未登録",
    nameEn: tags["name:en"] || "",
    shop: tags.shop,
    brand: tags.brand || "",
    branch: tags.branch || "",
    address: address || tags["addr:full"] || "",
    postcode: tags["addr:postcode"] || "",
    openingHours: tags.opening_hours || "",
    phone: tags.phone || tags["contact:phone"] || "",
    website: tags.website || tags["contact:website"] || "",
    wheelchair: tags.wheelchair || "",
    buildingLevels: Number(tags["building:levels"]) || null,
    areaSqm,
  };
}

async function main() {
  console.log("OpenStreetMapから千葉県内のshop=*を取得しています…");

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "ChibaTaxiFlowMap/1.0 (local data preparation)",
    },
    body: new URLSearchParams({ data: query }),
  });

  if (!response.ok) {
    const message = (await response.text()).slice(0, 500);
    throw new Error(`Overpass API error ${response.status}: ${message}`);
  }

  const data = await response.json();
  const features = data.elements.flatMap((element) => {
    const coordinates = getCoordinates(element);
    if (!coordinates || !element.tags?.shop) return [];
    const polygonGeometry = getPolygonGeometry(element);
    const areaSqm = polygonGeometry ? getElementAreaSqm(element) : null;

    return [
      {
        type: "Feature",
        id: `${element.type}/${element.id}`,
        geometry: polygonGeometry || { type: "Point", coordinates },
        properties: compactProperties(element, coordinates, areaSqm),
      },
    ];
  });

  const geojson = {
    type: "FeatureCollection",
    attribution: "© OpenStreetMap contributors, ODbL 1.0",
    generatedAt: new Date().toISOString(),
    query: `Chiba Prefecture (JP-12), shop=${SHOP_TYPES.join("|")}`,
    features,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(geojson)}\n`, "utf-8");
  console.log(`${features.length}件を${OUTPUT_PATH}に保存しました。`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
