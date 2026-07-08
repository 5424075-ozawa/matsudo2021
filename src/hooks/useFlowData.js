import { useEffect, useState } from "react";

export function useFlowData(month) {
  const [data, setData] = useState([]);
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
        const headers = lines[0].split(",").map((header) => header.trim());

        const rows = lines.slice(1).map((line) => {
          const values = line.split(",");
          const row = {};

          headers.forEach((header, index) => {
            row[header] = values[index]?.trim();
          });

          row.population = Number(row.population);

          return row;
        });

        const matsudoData = rows.filter(
          (row) => row.citycode === "12207"
        );

        setData(matsudoData);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setData([]);
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
  }, [month]);

  return {
    data,
    loading,
    error,
  };
}