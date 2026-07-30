import { useEffect, useMemo, useState } from "react";
import { DivIcon, latLngBounds } from "leaflet";
import { Marker, Popup } from "react-leaflet";

import { mesh1kmToBounds } from "../utils/mesh";

function getCategoryLabel(category) {
  if (category === "station") return "駅";
  if (category === "shopping") return "商業施設";
  if (category === "stadium") return "球場・スタジアム";
  if (category === "university") return "大学";
  if (category === "hospital") return "病院";
  return "施設";
}

function getCategoryIcon(category) {
  if (category === "station") return "🚉";
  if (category === "shopping") return "🛍️";
  if (category === "stadium") return "🏟️";
  if (category === "university") return "🏫";
  if (category === "hospital") return "🏥";
  return "📍";
}

function getFacilityCategory(tags) {
  if (tags.railway === "station") return "station";

  if (
    tags.shop === "mall" ||
    tags.shop === "department_store" ||
    tags.shop === "supermarket" ||
    tags.building === "retail"
  ) {
    return "shopping";
  }

  if (
    tags.leisure === "stadium" ||
    tags.leisure === "sports_centre"
  ) {
    return "stadium";
  }

  if (
    tags.amenity === "university" ||
    tags.amenity === "college"
  ) {
    return "university";
  }

  if (tags.amenity === "hospital") return "hospital";

  return "other";
}

function createIcon(category) {
  return new DivIcon({
    html: `<div class="facility-marker">${getCategoryIcon(category)}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function getAreaBounds(data) {
  if (data.length === 0) return null;

  const bounds = latLngBounds([]);

  data.forEach((item) => {
    const meshBounds = mesh1kmToBounds(item.mesh1kmid);
    bounds.extend(meshBounds[0]);
    bounds.extend(meshBounds[1]);
  });

  return bounds;
}

function buildOverpassQuery(bounds) {
  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();

  return `
    [out:json][timeout:25];
    (
      node["railway"="station"](${south},${west},${north},${east});
      way["railway"="station"](${south},${west},${north},${east});

      node["shop"~"mall|department_store|supermarket"](${south},${west},${north},${east});
      way["shop"~"mall|department_store|supermarket"](${south},${west},${north},${east});

      node["building"="retail"](${south},${west},${north},${east});
      way["building"="retail"](${south},${west},${north},${east});

      node["leisure"~"stadium|sports_centre"](${south},${west},${north},${east});
      way["leisure"~"stadium|sports_centre"](${south},${west},${north},${east});

      node["amenity"~"university|college|hospital"](${south},${west},${north},${east});
      way["amenity"~"university|college|hospital"](${south},${west},${north},${east});
    );
    out center tags;
  `;
}

function FacilityMarkers({ data }) {
  const [facilities, setFacilities] = useState([]);
  const [status, setStatus] = useState("施設データ取得中...");

  const areaBounds = useMemo(() => {
    return getAreaBounds(data);
  }, [data]);

  useEffect(() => {
    if (!areaBounds) {
      setFacilities([]);
      setStatus("施設データなし");
      return;
    }

    async function loadFacilities() {
      try {
        setStatus("施設データ取得中...");

        const query = buildOverpassQuery(areaBounds);

        const response = await fetch(
          "https://overpass-api.de/api/interpreter",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8",
            },
            body: `data=${encodeURIComponent(query)}`,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTPエラー: ${response.status}`);
        }

        const json = await response.json();

        const items = json.elements
          .map((element) => {
            const tags = element.tags || {};
            const lat = element.lat ?? element.center?.lat;
            const lng = element.lon ?? element.center?.lon;

            if (lat == null || lng == null) return null;
            if (!tags.name) return null;

            return {
              id: `${element.type}-${element.id}`,
              name: tags.name,
              lat,
              lng,
              category: getFacilityCategory(tags),
            };
          })
          .filter(Boolean);

        const uniqueItems = Array.from(
          new Map(items.map((item) => [item.id, item])).values()
        );

        setFacilities(uniqueItems);

        if (uniqueItems.length > 0) {
          setStatus(`施設データ：${uniqueItems.length}件取得`);
        } else {
          setStatus("この営業区域では施設が見つかりませんでした");
        }
      } catch (error) {
        console.error("施設取得エラー:", error);

        if (facilities.length > 0) {
          setStatus(`施設データ：${facilities.length}件表示中`);
        } else {
          setStatus("施設データを取得できませんでした");
        }
      }
    }

    loadFacilities();
  }, [areaBounds]);

  return (
    <>
      <div className="facility-status">{status}</div>

      {facilities.map((facility) => (
        <Marker
          key={facility.id}
          position={[facility.lat, facility.lng]}
          icon={createIcon(facility.category)}
        >
          <Popup>
            <div>
              <strong>{facility.name}</strong>
              <br />
              種類：{getCategoryLabel(facility.category)}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default FacilityMarkers;