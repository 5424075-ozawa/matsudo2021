import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

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
  const resultsRef = useRef(null);
  const [resultsOffset, setResultsOffset] = useState(0);

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

  useLayoutEffect(() => {
    if (!open || !query.trim() || !resultsRef.current) {
      setResultsOffset(0);
      return undefined;
    }

    const keepInsideViewport = () => {
      const resultsElement = resultsRef.current;
      const anchorElement = resultsElement?.offsetParent;
      const bounds = resultsElement?.getBoundingClientRect();
      const anchorBounds = anchorElement?.getBoundingClientRect();
      if (!bounds || !anchorBounds) return;

      const rightLimit = window.innerWidth - 10;
      const naturalRight = anchorBounds.right;
      const naturalLeft = naturalRight - bounds.width;
      let nextOffset = 0;

      if (naturalRight > rightLimit) nextOffset = rightLimit - naturalRight;
      if (naturalLeft + nextOffset < 10) nextOffset += 10 - (naturalLeft + nextOffset);

      setResultsOffset(nextOffset);
    };

    keepInsideViewport();
    window.addEventListener("resize", keepInsideViewport);
    return () => window.removeEventListener("resize", keepInsideViewport);
  }, [open, query, results.length]);

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
        <div
          ref={resultsRef}
          className="placeSearchResults"
          role="listbox"
          style={{ transform: `translateX(${resultsOffset}px)` }}
        >
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
