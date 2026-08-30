const fs = require("fs/promises");
const path = require("path");

const DATA_ROOT = "public/data/2021";
const OUTPUT_PATH = "public/data/place_names.json";
const CONCURRENCY = 5;
const SAVE_INTERVAL = 100;

function mesh1kmToCenter(meshId) {
  const code = String(meshId);
  const p = Number(code.slice(0, 2));
  const q = Number(code.slice(2, 4));
  const r = Number(code.slice(4, 5));
  const s = Number(code.slice(5, 6));
  const t = Number(code.slice(6, 7));
  const u = Number(code.slice(7, 8));
  const south = p / 1.5 + r * (5 / 60) + t * (30 / 3600);
  const west = q + 100 + s * (7.5 / 60) + u * (45 / 3600);

  return {
    lat: south + 15 / 3600,
    lng: west + 22.5 / 3600,
  };
}

async function getMeshIds() {
  const monthDirectories = (await fs.readdir(DATA_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const meshIds = new Set();

  for (const month of monthDirectories) {
    const csv = await fs.readFile(
      path.join(DATA_ROOT, month, "monthly_mdp_mesh1km.csv"),
      "utf-8"
    );
    const lines = csv.trim().split(/\r?\n/);

    for (const line of lines.slice(1)) {
      const [meshId, prefcode] = line.split(",");
      if (prefcode === "12") meshIds.add(meshId);
    }
  }

  return [...meshIds].sort();
}

async function loadExistingNames() {
  try {
    return JSON.parse(await fs.readFile(OUTPUT_PATH, "utf-8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function fetchPlaceName(meshId) {
  const center = mesh1kmToCenter(meshId);
  const url = new URL(
    "https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress"
  );
  url.searchParams.set("lat", center.lat);
  url.searchParams.set("lon", center.lng);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "ChibaTaxiFlowMap/1.0 (local data preparation)" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.results?.lv01Nm || "地名不明";
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
}

async function save(placeNames) {
  const sorted = Object.fromEntries(
    Object.entries(placeNames).sort(([left], [right]) => left.localeCompare(right))
  );
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf-8");
}

async function main() {
  const meshIds = await getMeshIds();
  const placeNames = await loadExistingNames();
  const pending = meshIds.filter((meshId) => !placeNames[meshId]);
  let completed = 0;

  console.log(
    `${meshIds.length}メッシュ中、${pending.length}件の地名を取得します。`
  );

  async function worker() {
    while (pending.length > 0) {
      const meshId = pending.shift();
      try {
        placeNames[meshId] = await fetchPlaceName(meshId);
      } catch (error) {
        console.error(`${meshId}: ${error.message}`);
        placeNames[meshId] = "地名取得不可";
      }

      completed += 1;
      if (completed % SAVE_INTERVAL === 0) {
        await save(placeNames);
        console.log(`${completed}/${completed + pending.length}件取得済み`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await save(placeNames);
  console.log(`${Object.keys(placeNames).length}件を${OUTPUT_PATH}に保存しました。`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
