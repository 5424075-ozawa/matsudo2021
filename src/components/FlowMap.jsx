import {
  MapContainer,
  Popup,
  Rectangle,
  TileLayer,
} from "react-leaflet";

import { mesh1kmToBounds } from "../utils/mesh";
import { getColor } from "../utils/color";

import {
  dayflagLabels,
  timezoneLabels,
} from "../utils/labels";

function FlowMap({ data, maxPopulation, getPlaceName }) {
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

        {data.map((item) => (
          <Rectangle
            key={`${item.mesh1kmid}-${item.dayflag}-${item.timezone}`}
            bounds={mesh1kmToBounds(item.mesh1kmid)}
            pathOptions={{
              color: "#555",
              weight: 0.7,
              fillColor: getColor(
                item.population,
                maxPopulation
              ),
              fillOpacity: 0.45,
            }}
          >
            <Popup>
              <div>
                <strong>{getPlaceName(item.mesh1kmid)}</strong>

                <br />
                メッシュID：{item.mesh1kmid}

                <br />
                滞在人口：
                {item.population.toLocaleString()}人

                <br />
                年月：
                {item.year}年{Number(item.month)}月

                <br />
                区分：
                {dayflagLabels[item.dayflag]}

                <br />
                時間帯：
                {timezoneLabels[item.timezone]}
              </div>
            </Popup>
          </Rectangle>
        ))}
      </MapContainer>
    </div>
  );
}

export default FlowMap;