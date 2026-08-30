import { useEffect, useState } from "react";

export function usePlaceNames() {
  const [placeNames, setPlaceNames] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/data/place_names.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("ローカル地名データが見つかりません");
        return response.json();
      })
      .then(setPlaceNames)
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      })
      .finally(() => setLoaded(true));

    return () => controller.abort();
  }, []);

  function getPlaceName(meshId) {
    return placeNames[String(meshId)] || (loaded ? "地名不明" : "地名読込中...");
  }

  return {
    getPlaceName,
  };
}
