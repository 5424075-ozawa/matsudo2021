import { useEffect, useMemo, useState } from "react";
import { divIcon } from "leaflet";
import { Marker, Popup } from "react-leaflet";

import { mesh1kmToBounds } from "../utils/mesh";

const visibleShopTypes = new Set([
  "mall",
  "department_store",
]);

function isInsideDataArea([lng, lat], boundsList) {
  return boundsList.some(
    ([[south, west], [north, east]]) =>
      lat >= south && lat <= north && lng >= west && lng <= east
  );
}

function getFacilityScale(areaSqm) {
  if (!areaSqm) return { label: "不明", size: 14, className: "UnknownSize" };
  if (areaSqm < 5000) return { label: "小", size: 16, className: "Small" };
  if (areaSqm < 20000) return { label: "中", size: 22, className: "Medium" };
  return { label: "大", size: 30, className: "Large" };
}

function getCommercialIcon(areaSqm) {
  const { size, className } = getFacilityScale(areaSqm);

  return divIcon({
    className: "facilityMarkerWrapper",
    html: `<span class="facilityMarkerPin facilityMarkerPin${className}" style="--pin-size:${size}px"></span>`,
    iconSize: [size, size * 1.35],
    iconAnchor: [size / 2, size * 1.28],
    popupAnchor: [0, -size * 1.15],
  });
}

function OsmCommercialMarkers({ data }) {
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/data/osm/commercial_facilities.geojson", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("OSM商業施設データが見つかりません");
        return response.json();
      })
      .then((geojson) =>
        setFacilities(
          geojson.features.filter((feature) =>
            visibleShopTypes.has(feature.properties.shop)
          )
        )
      )
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, []);

  const visibleFacilities = useMemo(() => {
    const boundsList = data.map((item) => mesh1kmToBounds(item.mesh1kmid));
    return facilities.filter(
      (facility) =>
        isInsideDataArea(facility.properties.center, boundsList)
    );
  }, [data, facilities]);

  return visibleFacilities.map((facility) => {
    const properties = facility.properties;
    const [lng, lat] = properties.center;

    return (
      <Marker
        key={facility.id}
        position={[lat, lng]}
        icon={getCommercialIcon(properties.areaSqm)}
        zIndexOffset={500}
      >
        <Popup>
          <div className="facilityPopup">
            <strong>{properties.name}</strong>
            <span>商業施設</span>
            {properties.brand && <p>ブランド：{properties.brand}</p>}
            {properties.address && <p>住所：{properties.address}</p>}
            {properties.openingHours && (
              <p>営業時間：{properties.openingHours}</p>
            )}
            {properties.areaSqm && (
              <p>建物・敷地面積：約{properties.areaSqm.toLocaleString()}㎡</p>
            )}
            {!properties.areaSqm && <p>建物・敷地面積：不明</p>}
            <p>規模：{getFacilityScale(properties.areaSqm).label}</p>
            {properties.buildingLevels && (
              <p>階数：{properties.buildingLevels}階</p>
            )}
            {properties.phone && <p>電話：{properties.phone}</p>}
            {properties.website && (
              <a href={properties.website} target="_blank" rel="noreferrer">
                施設サイト
              </a>
            )}
            <small>© OpenStreetMap contributors</small>
          </div>
        </Popup>
      </Marker>
    );
  });
}

export default OsmCommercialMarkers;
