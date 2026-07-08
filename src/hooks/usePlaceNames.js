import { useEffect, useState } from "react";
import { mesh1kmToCenter } from "../utils/mesh";

async function fetchPlaceName(meshId) {
  const center = mesh1kmToCenter(meshId);

  const url =
    "https://mreversegeocoder.gsi.go.jp/reverse-geocoder/" +
    `LonLatToAddress?lat=${center.lat}&lon=${center.lng}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("地名の取得に失敗しました");
  }

  const json = await response.json();

  return json.results?.lv01Nm || "地名不明";
}

export function usePlaceNames(data) {
  const [placeNames, setPlaceNames] = useState({});

  useEffect(() => {
    const meshIds = [...new Set(data.map((item) => String(item.mesh1kmid)))];

    const missingIds = meshIds.filter((id) => !placeNames[id]);

    if (missingIds.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadPlaceNames() {
      const results = {};

      for (const meshId of missingIds) {
        try {
          results[meshId] = await fetchPlaceName(meshId);
        } catch (error) {
          console.error(error);
          results[meshId] = "地名取得不可";
        }
      }

      if (!cancelled) {
        setPlaceNames((current) => ({
          ...current,
          ...results,
        }));
      }
    }

    loadPlaceNames();

    return () => {
      cancelled = true;
    };
  }, [data]);

  function getPlaceName(meshId) {
    return placeNames[String(meshId)] || "地名取得中...";
  }

  return {
    getPlaceName,
  };
}