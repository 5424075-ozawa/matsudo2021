const fs = require("fs/promises");
const path = require("path");

const OVERPASS_URL =
  process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const OUTPUT_PATH = "public/data/osm/commercial_facilities.geojson";

const query = `[out:json][timeout:180];
area["ISO3166-2"="JP-12"][boundary=administrative]->.chiba;
nwr["shop"](area.chiba);
out center tags;`;

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

  return null;
}

function compactProperties(element) {
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

    return [
      {
        type: "Feature",
        id: `${element.type}/${element.id}`,
        geometry: { type: "Point", coordinates },
        properties: compactProperties(element),
      },
    ];
  });

  const geojson = {
    type: "FeatureCollection",
    attribution: "© OpenStreetMap contributors, ODbL 1.0",
    generatedAt: new Date().toISOString(),
    query: "Chiba Prefecture (JP-12), shop=*",
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
