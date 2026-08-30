import { useEffect, useMemo, useState } from "react";

import { mesh1kmToBounds } from "../utils/mesh";

function isInsideDataArea(lat, lng, boundsList) {
  return boundsList.some(
    ([[south, west], [north, east]]) =>
      lat >= south && lat <= north && lng >= west && lng <= east
  );
}

function normalize(value) {
  return value.trim().toLocaleLowerCase("ja");
}

function PlaceSearch({ data, onSelect }) {
  const [places, setPlaces] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch("/data/stations/stations_passenger.json", {
        signal: controller.signal,
      }).then((response) => {
        if (!response.ok) throw new Error("駅データが見つかりません");
        return response.json();
      }),
      fetch("/data/osm/commercial_facilities.geojson", {
        signal: controller.signal,
      }).then((response) => {
        if (!response.ok) throw new Error("商業施設データが見つかりません");
        return response.json();
      }),
    ])
      .then(([stations, facilities]) => {
        setPlaces([
          ...stations.map((station) => ({
            id: `station-${station.id}`,
            type: "station",
            name: `${station.name}駅`,
            searchName: station.name,
            lat: station.lat,
            lng: station.lng,
          })),
          ...facilities.features.map((facility) => ({
            id: `facility-${facility.id}`,
            type: "facility",
            name: facility.properties.name,
            searchName: facility.properties.name,
            lat: facility.properties.center[1],
            lng: facility.properties.center[0],
          })),
        ]);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, []);

  const visiblePlaces = useMemo(() => {
    const boundsList = data.map((item) => mesh1kmToBounds(item.mesh1kmid));
    return places.filter((place) =>
      isInsideDataArea(place.lat, place.lng, boundsList)
    );
  }, [data, places]);

  const results = useMemo(() => {
    const normalizedQuery = normalize(query).replace(/駅$/, "");
    if (!normalizedQuery) return [];

    return visiblePlaces
      .filter((place) => normalize(place.searchName).includes(normalizedQuery))
      .sort((left, right) => {
        const leftStarts = normalize(left.searchName).startsWith(normalizedQuery);
        const rightStarts = normalize(right.searchName).startsWith(normalizedQuery);
        return Number(rightStarts) - Number(leftStarts) || left.name.localeCompare(right.name, "ja");
      })
      .slice(0, 8);
  }, [query, visiblePlaces]);

  function selectPlace(place) {
    setQuery(place.name);
    setOpen(false);
    onSelect(place);
  }

  return (
    <div className="placeSearch">
      <input
        type="search"
        value={query}
        placeholder="駅名・施設名を検索"
        aria-label="駅名または商業施設名を検索"
        aria-expanded={open && results.length > 0}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;

          if (event.key === "Enter" && results[0]) {
            event.preventDefault();
            selectPlace(results[0]);
          }
          if (event.key === "Escape") setOpen(false);
        }}
      />

      {open && query.trim() && (
        <div className="placeSearchResults" role="listbox">
          {results.length > 0 ? (
            results.map((place) => (
              <button
                key={place.id}
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectPlace(place)}
              >
                <span>{place.name}</span>
                <small>{place.type === "station" ? "駅" : "商業施設"}</small>
              </button>
            ))
          ) : (
            <p>該当する駅・施設がありません</p>
          )}
        </div>
      )}
    </div>
  );
}

export default PlaceSearch;
