import { Fragment, useEffect, useRef } from "react";
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
import OsmCommercialMarkers from "./OsmCommercialMarkers";

import { mesh1kmToBounds } from "../utils/mesh";
import { getColor } from "../utils/color";
import { selectionColors } from "../utils/selectionColors";

import { dayflagLabels, timezoneLabels } from "../utils/labels";

function MapInteractionHandler({ onInteraction }) {
  useMapEvents({
    dragstart: onInteraction,
    zoomstart: onInteraction,
  });

  return null;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let animationFrame = null;

    const observer = new ResizeObserver(() => {
      if (animationFrame != null) cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        map.invalidateSize({ animate: false, pan: false });
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (animationFrame != null) cancelAnimationFrame(animationFrame);
    };
  }, [map]);

  return null;
}

function MapPaneVisibility({ name, visible }) {
  const map = useMap();

  useEffect(() => {
    const pane = map.getPane(name);
    if (!pane) return;

    pane.style.opacity = visible ? "1" : "0";
    pane.style.pointerEvents = visible ? "auto" : "none";
  }, [map, name, visible]);

  return null;
}

function insetBounds([[south, west], [north, east]]) {
  const latitudeInset = (north - south) * 0.012;
  const longitudeInset = (east - west) * 0.012;

  return [
    [south + latitudeInset, west + longitudeInset],
    [north - latitudeInset, east - longitudeInset],
  ];
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

function MapMeshFocus({ request }) {
  const map = useMap();

  useEffect(() => {
    if (!request.meshId) return;

    const center = latLngBounds(mesh1kmToBounds(request.meshId)).getCenter();
    map.flyTo(center, Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 0.6,
    });
  }, [map, request]);

  return null;
}

function MapPointFocus({ request }) {
  const map = useMap();

  useEffect(() => {
    if (!Number.isFinite(request.lat) || !Number.isFinite(request.lng)) return;

    map.flyTo([request.lat, request.lng], Math.max(map.getZoom(), 15), {
      animate: true,
      duration: 0.7,
    });
  }, [map, request]);

  return null;
}

function FlowMap({
  data,
  fitArea,
  maxPopulation,
  getPlaceName,
  showStations,
  showCommercialFacilities,
  selectedMeshIds,
  selectedMeshColorSlots,
  meshFocusRequest,
  pointFocusRequest,
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAreaFit data={data} area={fitArea} />
        <MapMeshFocus request={meshFocusRequest} />
        <MapPointFocus request={pointFocusRequest} />
        <MapInteractionHandler onInteraction={onMapInteraction} />
        <MapResizeHandler />

        {data.map((item) => {
            const selectedIndex = selectedMeshIds.indexOf(item.mesh1kmid);
            const isSelected = selectedIndex !== -1;
            const selectedColor =
              selectionColors[
                selectedMeshColorSlots[item.mesh1kmid] ?? selectedIndex
              ];

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
                <Popup pane="popupPane">
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

        <StationMarkers data={data} />
        <OsmCommercialMarkers data={data} />
        <MapPaneVisibility name="stationMarkersPane" visible={showStations} />
        <MapPaneVisibility
          name="commercialMarkersPane"
          visible={showCommercialFacilities}
        />
      </MapContainer>
    </div>
  );
}

export default FlowMap;
