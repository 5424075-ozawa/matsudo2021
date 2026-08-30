const fs = require("fs/promises");

const INPUT_PATH = "public/data/sc/P33-14_12.xml";
const OUTPUT_PATH = "public/data/sc/attracting_facilities.json";

const typeLabels = {
  1: "映画館",
  2: "公会堂・集会場",
  3: "劇場・演芸場",
  4: "展示場",
  5: "体育館・観覧場",
  6: "その他の集客施設",
};

function decodeXml(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .trim();
}

function readTag(block, tag) {
  const match = block.match(
    new RegExp(`<ksj:${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/ksj:${tag}>`)
  );
  return match ? decodeXml(match[1]) : "";
}

function cleanOptionalValue(value) {
  return value === "-1" || value === "‐" ? "" : value;
}

async function main() {
  const xml = await fs.readFile(INPUT_PATH, "utf-8");
  const points = new Map();

  for (const match of xml.matchAll(
    /<gml:Point gml:id="([^"]+)">[\s\S]*?<gml:pos>([^<]+)<\/gml:pos>[\s\S]*?<\/gml:Point>/g
  )) {
    const [lat, lng] = match[2].trim().split(/\s+/).map(Number);
    points.set(match[1], { lat, lng });
  }

  const facilities = [];

  for (const match of xml.matchAll(
    /<ksj:AttractCustomersFacility gml:id="([^"]+)">([\s\S]*?)<\/ksj:AttractCustomersFacility>/g
  )) {
    const block = match[2];
    const pointId = block.match(/<ksj:position xlink:href="#([^"]+)"\/>/)?.[1];
    const point = points.get(pointId);
    if (!point) continue;

    const typeCode = Number(readTag(block, "facilityTypeCode"));

    facilities.push({
      id: match[1],
      ...point,
      citycode: readTag(block, "administrativeAreaCode"),
      typeCode,
      type: typeLabels[typeCode] || "集客施設",
      name: readTag(block, "facilityName"),
      postalCode: cleanOptionalValue(readTag(block, "postalCode")),
      address: cleanOptionalValue(readTag(block, "address")),
      telephone: cleanOptionalValue(readTag(block, "telephoneNumber")),
      url: cleanOptionalValue(readTag(block, "url")),
      access: cleanOptionalValue(readTag(block, "access")),
    });
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(facilities, null, 2), "utf-8");
  console.log(`${facilities.length}施設を保存しました。`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
