import { useEffect, useState } from "react";
import { serviceAreas } from "../utils/serviceAreas";

export function useFlowData(month, selectedArea) {
  const [data, setData] = useState([]);
  const [loadedArea, setLoadedArea] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/data/2021/${month}/monthly_mdp_mesh1km.csv`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("CSVファイルが見つかりません");
        }

        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);
        const headers = lines[0]
          .split(",")
          .map((header) => header.trim());

        const rows = lines.slice(1).map((line) => {
          const values = line.split(",");
          const row = {};

          headers.forEach((header, index) => {
            row[header] = values[index]?.trim();
          });

          row.population = Number(row.population);

          return row;
        });

        const area = serviceAreas[selectedArea];

        if (!area) {
          throw new Error("選択された営業区域が見つかりません");
        }

        const filteredData =
          area.citycodes === "chiba"
            ? rows.filter((row) => row.citycode.startsWith("12"))
            : rows.filter((row) =>
                area.citycodes.includes(row.citycode)
              );

        setData(filteredData);
        setLoadedArea(selectedArea);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setData([]);
          setLoadedArea(null);
          setError("人流データの読み込みに失敗しました。");
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      controller.abort();
    };
  }, [month, selectedArea]);

  return {
    data,
    loadedArea,
    loading,
    error,
  };
}
