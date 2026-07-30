import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import {
  dayflagLabels,
  timezoneLabels,
} from "../utils/labels";

const months = [
  { value: "01", label: "1月" },
  { value: "02", label: "2月" },
  { value: "03", label: "3月" },
  { value: "04", label: "4月" },
  { value: "05", label: "5月" },
  { value: "06", label: "6月" },
  { value: "07", label: "7月" },
  { value: "08", label: "8月" },
  { value: "09", label: "9月" },
  { value: "10", label: "10月" },
  { value: "11", label: "11月" },
  { value: "12", label: "12月" },
];

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0]
    .split(",")
    .map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim();
    });

    row.population = Number(row.population);

    return row;
  });
}

function formatNumber(value) {
  if (value == null || Number.isNaN(value)) {
    return "-";
  }

  return value.toLocaleString();
}

function formatDiff(value) {
  if (value == null || Number.isNaN(value)) {
    return "-";
  }

  if (value > 0) {
    return `+${value.toLocaleString()}人`;
  }

  return `${value.toLocaleString()}人`;
}

function MeshComparisonPanel({
  selectedMeshId,
  dayflag,
  timezone,
  getPlaceName,
}) {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedMeshId) {
      setMonthlyData([]);
      return;
    }

    const controller = new AbortController();

    async function loadMonthlyData() {
      setLoading(true);
      setError("");

      try {
        const result = await Promise.all(
          months.map(async (month) => {
            const response = await fetch(
              `/data/2021/${month.value}/monthly_mdp_mesh1km.csv`,
              {
                signal: controller.signal,
              }
            );

            if (!response.ok) {
              throw new Error(`${month.label}のCSVを読み込めません`);
            }

            const text = await response.text();
            const rows = parseCsv(text);

            const target = rows.find(
              (row) =>
                row.mesh1kmid === selectedMeshId &&
                row.dayflag === dayflag &&
                row.timezone === timezone
            );

            return {
              month: month.label,
              monthValue: month.value,
              population: target ? target.population : 0,
            };
          })
        );

        setMonthlyData(result);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setMonthlyData([]);
          setError("月別比較データを読み込めませんでした。");
        }
      } finally {
        setLoading(false);
      }
    }

    loadMonthlyData();

    return () => {
      controller.abort();
    };
  }, [selectedMeshId, dayflag, timezone]);

  const statistics = useMemo(() => {
    if (monthlyData.length === 0) {
      return null;
    }

    const values = monthlyData.map((item) => item.population);
    const total = values.reduce((sum, value) => sum + value, 0);

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    const maxMonth = monthlyData.find(
      (item) => item.population === maxValue
    );

    const minMonth = monthlyData.find(
      (item) => item.population === minValue
    );

    const january = monthlyData.find(
      (item) => item.monthValue === "01"
    );

    const december = monthlyData.find(
      (item) => item.monthValue === "12"
    );

    const diffMaxMin = maxValue - minValue;
    const diffDecJan =
      december && january
        ? december.population - january.population
        : null;

    const average = Math.round(total / monthlyData.length);

    let largestIncrease = null;

    for (let i = 1; i < monthlyData.length; i++) {
      const previous = monthlyData[i - 1];
      const current = monthlyData[i];
      const diff = current.population - previous.population;

      if (
        largestIncrease === null ||
        diff > largestIncrease.diff
      ) {
        largestIncrease = {
          from: previous.month,
          to: current.month,
          diff,
        };
      }
    }

    return {
      maxValue,
      minValue,
      maxMonth,
      minMonth,
      diffMaxMin,
      diffDecJan,
      average,
      largestIncrease,
    };
  }, [monthlyData]);

  if (!selectedMeshId) {
    return (
      <section className="comparisonPanel">
        <h2>メッシュ月別比較</h2>
        <p>
          地図上のメッシュをクリックすると、
          1月〜12月の推移を表示します。
        </p>
      </section>
    );
  }

  return (
    <section className="comparisonPanel">
      <h2>メッシュ月別比較</h2>

      <p className="meshName">
        {getPlaceName(selectedMeshId)}
      </p>

      <p className="meshId">
        メッシュID：{selectedMeshId}
      </p>

      <p className="comparisonCondition">
        条件：{dayflagLabels[dayflag]} / {timezoneLabels[timezone]}
      </p>

      {loading && <p>月別データを読み込み中...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && monthlyData.length > 0 && (
        <>
          <div className="lineChartBox">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip
                  formatter={(value) => [
                    `${value.toLocaleString()}人`,
                    "滞在人口",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="population"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {statistics && (
            <div className="comparisonStats">
              <div>
                <span>最大</span>
                <strong>
                  {statistics.maxMonth?.month}：
                  {formatNumber(statistics.maxValue)}人
                </strong>
              </div>

              <div>
                <span>最小</span>
                <strong>
                  {statistics.minMonth?.month}：
                  {formatNumber(statistics.minValue)}人
                </strong>
              </div>

              <div>
                <span>最大月 - 最小月</span>
                <strong>
                  {formatDiff(statistics.diffMaxMin)}
                </strong>
              </div>

              <div>
                <span>12月 - 1月</span>
                <strong>
                  {formatDiff(statistics.diffDecJan)}
                </strong>
              </div>

              <div>
                <span>平均</span>
                <strong>
                  {formatNumber(statistics.average)}人
                </strong>
              </div>

              <div>
                <span>前月比で一番増えた月</span>
                <strong>
                  {statistics.largestIncrease?.from}
                  から
                  {statistics.largestIncrease?.to}
                  ：
                  {formatDiff(statistics.largestIncrease?.diff)}
                </strong>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default MeshComparisonPanel;