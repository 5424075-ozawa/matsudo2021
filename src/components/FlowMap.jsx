import { useEffect } from "react";
import {
  MapContainer,
  Popup,
  Rectangle,
  TileLayer,
  useMap,
} from "react-leaflet";
import { latLngBounds } from "leaflet";

import StationMarkers from "./StationMarkers";

import { mesh1kmToBounds } from "../utils/mesh";
import { getColor } from "../utils/color";

import { dayflagLabels, timezoneLabels } from "../utils/labels";

function MapAutoFit({ data }) {
  const map = useMap();

  useEffect(() => {
    if (data.length === 0) return;

    const bounds = latLngBounds([]);

    data.forEach((item) => {
      const meshBounds = mesh1kmToBounds(item.mesh1kmid);
      bounds.extend(meshBounds[0]);
      bounds.extend(meshBounds[1]);
    });

    map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 13,
    });
  }, [data, map]);

  return null;
}

function FlowMap({
  data,
  maxPopulation,
  getPlaceName,
  showMesh,
  showStations,
}) {
  return (
    <div className="mapArea">
      <MapContainer
        center={[35.7876, 139.9031]}
        zoom={12}
        style={{
          height: "650px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoFit data={data} />

        {showMesh &&
          data.map((item) => (
            <Rectangle
              key={`${item.mesh1kmid}-${item.dayflag}-${item.timezone}`}
              bounds={mesh1kmToBounds(item.mesh1kmid)}
              pathOptions={{
                color: "#555",
                weight: 0.7,
                fillColor: getColor(item.population, maxPopulation),
                fillOpacity: 0.45,
              }}
            >
              <Popup>
                <div>
                  <strong>{getPlaceName(item.mesh1kmid)}</strong>
                  <br />
                  メッシュID：{item.mesh1kmid}
                  <br />
                  滞在人口：{item.population.toLocaleString()}人
                  <br />
                  年月：{item.year}年{Number(item.month)}月
                  <br />
                  区分：{dayflagLabels[item.dayflag]}
                  <br />
                  時間帯：{timezoneLabels[item.timezone]}
                </div>
              </Popup>
            </Rectangle>
          ))}

        {showStations && <StationMarkers data={data} />}
      </MapContainer>
    </div>
  );
}

export default FlowMap;