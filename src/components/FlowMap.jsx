import { useEffect, useRef } from "react";
import {
  MapContainer,
  Popup,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { latLngBounds } from "leaflet";

import StationMarkers from "./StationMarkers";

import { mesh1kmToBounds } from "../utils/mesh";
import { getColor } from "../utils/color";

import { dayflagLabels, timezoneLabels } from "../utils/labels";

const selectedColors = ["#2563eb", "#dc2626"];

function MapInteractionHandler({ onInteraction }) {
  useMapEvents({
    dragstart: onInteraction,
    zoomstart: onInteraction,
  });

  return null;
}

function MapAreaFit({ data, area }) {
  const map = useMap();
  const fittedArea = useRef(null);

  useEffect(() => {
    if (!area || fittedArea.current === area || data.length === 0) return;

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

    fittedArea.current = area;
  }, [area, data, map]);

  return null;
}

function FlowMap({
  data,
  fitArea,
  maxPopulation,
  getPlaceName,
  showMesh,
  showStations,
  selectedMeshIds,
  onMeshSelect,
  onMapInteraction,
}) {
  return (
    <div className="mapArea">
      <MapContainer
        center={[35.7876, 139.9031]}
        zoom={12}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAreaFit data={data} area={fitArea} />
        <MapInteractionHandler onInteraction={onMapInteraction} />

        {showMesh &&
          data.map((item) => {
            const selectedIndex = selectedMeshIds.indexOf(item.mesh1kmid);
            const isSelected = selectedIndex !== -1;
            const selectedColor = selectedColors[selectedIndex];

            return (
              <Rectangle
                key={`${item.mesh1kmid}-${item.dayflag}-${item.timezone}`}
                bounds={mesh1kmToBounds(item.mesh1kmid)}
                pathOptions={{
                  color: isSelected ? selectedColor : "#555",
                  weight: isSelected ? 4 : 0.7,
                  fillColor: getColor(item.population, maxPopulation),
                  fillOpacity: isSelected ? 0.6 : 0.45,
                }}
                eventHandlers={{
                  click: () => onMeshSelect(item.mesh1kmid),
                }}
              >
                <Popup>
                  <div>
                    <strong>{getPlaceName(item.mesh1kmid)}</strong>
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
            );
          })}

        {showStations && <StationMarkers data={data} />}
      </MapContainer>
    </div>
  );
}

export default FlowMap;
