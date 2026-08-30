const fs = require("fs/promises");

const INPUT_PATH = "public/data/stations/raw/S12-22_NumberOfPassengers.geojson";
const OUTPUT_PATH = "public/data/stations/stations_passenger.json";

function getCenterFromCoordinates(coordinates) {
  const points = [];

  function collectPoints(coords) {
    if (
      Array.isArray(coords) &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      points.push(coords);
      return;
    }

    if (Array.isArray(coords)) {
      coords.forEach(collectPoints);
    }
  }

  collectPoints(coordinates);

  if (points.length === 0) {
    return null;
  }

  const total = points.reduce(
    (sum, point) => {
      return {
        lng: sum.lng + point[0],
        lat: sum.lat + point[1],
      };
    },
    { lng: 0, lat: 0 }
  );

  return {
    lng: total.lng / points.length,
    lat: total.lat / points.length,
  };
}

function isInChibaArea(lat, lng) {
  return (
    lat >= 34.85 &&
    lat <= 36.15 &&
    lng >= 139.70 &&
    lng <= 140.90
  );
}

async function main() {
  const text = await fs.readFile(INPUT_PATH, "utf-8");
  const geojson = JSON.parse(text);

  const stations = geojson.features
    .map((feature, index) => {
      const properties = feature.properties || {};

      const name = properties.S12_001;
      const company = properties.S12_002;
      const line = properties.S12_003;
      const passenger2021 = Number(properties.S12_049);

      if (!feature.geometry) return null;

      const center = getCenterFromCoordinates(
        feature.geometry.coordinates
      );

      if (!name) return null;
      if (!center) return null;
      if (!Number.isFinite(passenger2021)) return null;
      if (passenger2021 <= 0) return null;

      if (!isInChibaArea(center.lat, center.lng)) {
        return null;
      }

      return {
        id: `${name}-${line}-${index}`,
        name,
        company,
        line,
        passenger: passenger2021,
        lat: center.lat,
        lng: center.lng,
      };
    })
    .filter(Boolean);

  const mergedStations = Array.from(
    stations
      .reduce((map, station) => {
        const key = station.name;

        if (!map.has(key)) {
          map.set(key, {
            ...station,
            lines: [
              {
                company: station.company,
                line: station.line,
              },
            ],
          });
          return map;
        }

        const current = map.get(key);

        current.passenger += station.passenger;

        const hasSameLine = current.lines.some(
          (item) =>
            item.company === station.company && item.line === station.line
        );

        if (!hasSameLine) {
          current.lines.push({
            company: station.company,
            line: station.line,
          });
        }

        return map;
      }, new Map())
      .values()
  );

  mergedStations.sort((a, b) => b.passenger - a.passenger);

  await fs.mkdir("public/data/stations", {
    recursive: true,
  });

  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify(mergedStations, null, 2),
    "utf-8"
  );

  console.log(`${mergedStations.length}駅を保存しました。`);
  console.log(`保存先: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
