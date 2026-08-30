import { useEffect, useMemo, useState } from "react";
import { CircleMarker, Pane, Popup } from "react-leaflet";

import { mesh1kmToBounds } from "../utils/mesh";

function getMeshBoundsList(data) {
  return data.map((item) => mesh1kmToBounds(item.mesh1kmid));
}

function isPointInMeshBounds(lat, lng, meshBounds) {
  const [[south, west], [north, east]] = meshBounds;

  return lat >= south && lat <= north && lng >= west && lng <= east;
}

function isPointInArea(lat, lng, meshBoundsList) {
  return meshBoundsList.some((meshBounds) =>
    isPointInMeshBounds(lat, lng, meshBounds)
  );
}

function getMarkerRadius(passenger, maxPassenger) {
  if (!maxPassenger) return 8;

  const ratio = passenger / maxPassenger;

  return 7 + Math.sqrt(ratio) * 28;
}

function StationMarkers({ data }) {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    async function loadStations() {
      try {
        const response = await fetch("/data/stations/stations_passenger.json");

        if (!response.ok) {
          throw new Error("駅乗降客数データが見つかりません");
        }

        const json = await response.json();
        setStations(json);
      } catch (error) {
        console.error(error);
        setStations([]);
      }
    }

    loadStations();
  }, []);

  const visibleStations = useMemo(() => {
    if (data.length === 0) return [];

    const meshBoundsList = getMeshBoundsList(data);

    return stations.filter((station) =>
      isPointInArea(station.lat, station.lng, meshBoundsList)
    );
  }, [stations, data]);

  const maxPassenger = useMemo(() => {
    if (visibleStations.length === 0) return 0;

    return Math.max(...visibleStations.map((station) => station.passenger));
  }, [visibleStations]);

  return (
    <Pane
      name="stationMarkersPane"
      className="mapMarkerPane"
      style={{ zIndex: 600 }}
    >
      {visibleStations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.lat, station.lng]}
          radius={getMarkerRadius(station.passenger, maxPassenger)}
          pane="stationMarkersPane"
          pathOptions={{
            color: "#111",
            weight: 1,
            fillOpacity: 0.55,
          }}
        >
          <Popup pane="popupPane">
            <div>
              <strong>{station.name}駅</strong>
              <br />
              乗降客数：{station.passenger.toLocaleString()}人/日
              <br />
              路線：
              {station.lines.map((item) => (
                <div key={`${item.company}-${item.line}`}>
                  {item.company} {item.line}
                </div>
              ))}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </Pane>
  );
}

export default StationMarkers;
