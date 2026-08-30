import { useEffect, useMemo, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";

import { mesh1kmToBounds } from "../utils/mesh";

const facilityIcon = divIcon({
  className: "facilityMarkerWrapper",
  html: '<span class="facilityMarkerPin"></span>',
  iconSize: [22, 30],
  iconAnchor: [11, 30],
  popupAnchor: [0, -28],
});

function isInsideDataArea(facility, boundsList) {
  return boundsList.some(
    ([[south, west], [north, east]]) =>
      facility.lat >= south &&
      facility.lat <= north &&
      facility.lng >= west &&
      facility.lng <= east
  );
}

function FacilityMarkers({ data }) {
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/data/sc/attracting_facilities.json", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("集客施設データが見つかりません");
        return response.json();
      })
      .then(setFacilities)
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, []);

  const visibleFacilities = useMemo(() => {
    const boundsList = data.map((item) => mesh1kmToBounds(item.mesh1kmid));
    return facilities.filter((facility) =>
      isInsideDataArea(facility, boundsList)
    );
  }, [data, facilities]);

  return visibleFacilities.map((facility) => (
    <Marker
      key={facility.id}
      position={[facility.lat, facility.lng]}
      icon={facilityIcon}
      zIndexOffset={500}
    >
      <Popup pane="popupPane">
        <div className="facilityPopup">
          <strong>{facility.name}</strong>
          <span>{facility.type}</span>
          {facility.address && <p>住所：{facility.address}</p>}
          {facility.telephone && <p>電話：{facility.telephone}</p>}
          {facility.access && <p>アクセス：{facility.access}</p>}
          {facility.url && (
            <a href={facility.url} target="_blank" rel="noreferrer">
              施設サイト
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  ));
}

export default FacilityMarkers;
