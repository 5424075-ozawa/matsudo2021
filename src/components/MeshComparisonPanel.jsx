import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  dayflagLabels,
  timezoneLabels,
} from "../utils/labels";
import { selectionColors } from "../utils/selectionColors";

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

function createMeshStats(monthlyData, key) {
  const values = monthlyData.map((item) => item[key] ?? 0);

  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  const maxMonth = monthlyData.find((item) => item[key] === maxValue);
  const minMonth = monthlyData.find((item) => item[key] === minValue);

  const january = monthlyData.find((item) => item.monthValue === "01");
  const december = monthlyData.find((item) => item.monthValue === "12");

  let largestIncrease = null;

  for (let i = 1; i < monthlyData.length; i++) {
    const previous = monthlyData[i - 1];
    const current = monthlyData[i];
    const diff = (current[key] ?? 0) - (previous[key] ?? 0);

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
    average: Math.round(total / values.length),
    maxValue,
    minValue,
    maxMonth: maxMonth?.month,
    minMonth: minMonth?.month,
    diffMaxMin: maxValue - minValue,
    diffDecJan:
      december && january
        ? (december[key] ?? 0) - (january[key] ?? 0)
        : null,
    largestIncrease,
  };
}

function createPairDiffStats(monthlyData, firstKey, secondKey) {
  if (monthlyData.length === 0) {
    return null;
  }

  const differences = monthlyData.map((item) => ({
    month: item.month,
    diff: (item[firstKey] ?? 0) - (item[secondKey] ?? 0),
  }));

  const largestDifference = differences.reduce((maxItem, item) => {
    if (!maxItem) return item;

    return Math.abs(item.diff) > Math.abs(maxItem.diff)
      ? item
      : maxItem;
  }, null);

  return {
    largestDifference,
  };
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const first = payload[0];
  const second = payload[1];

  const firstValue = first?.value ?? 0;
  const secondValue = second?.value ?? 0;

  return (
    <div className="chartTooltip">
      <strong>{label}</strong>

      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name}：{formatNumber(item.value)}人
        </p>
      ))}

      {payload.length === 2 && (
        <p>
          差分：{formatDiff(firstValue - secondValue)}
        </p>
      )}
    </div>
  );
}

function ComparisonTable({
  title,
  firstName,
  secondName,
  firstStats,
  secondStats,
  pairStats,
}) {
  if (!firstStats || !secondStats) {
    return null;
  }

  return (
    <div className="comparisonTableBox">
      <h3 className="comparisonSubTitle">{title}</h3>

      <table className="comparisonTable">
        <thead>
          <tr>
            <th>項目</th>
            <th>{firstName}</th>
            <th>{secondName}</th>
            <th>差分</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>最大</td>
            <td>
              {firstStats.maxMonth}：
              {formatNumber(firstStats.maxValue)}人
            </td>
            <td>
              {secondStats.maxMonth}：
              {formatNumber(secondStats.maxValue)}人
            </td>
            <td>
              {formatDiff(firstStats.maxValue - secondStats.maxValue)}
            </td>
          </tr>

          <tr>
            <td>最小</td>
            <td>
              {firstStats.minMonth}：
              {formatNumber(firstStats.minValue)}人
            </td>
            <td>
              {secondStats.minMonth}：
              {formatNumber(secondStats.minValue)}人
            </td>
            <td>
              {formatDiff(firstStats.minValue - secondStats.minValue)}
            </td>
          </tr>

          <tr>
            <td>平均</td>
            <td>{formatNumber(firstStats.average)}人</td>
            <td>{formatNumber(secondStats.average)}人</td>
            <td>
              {formatDiff(firstStats.average - secondStats.average)}
            </td>
          </tr>

          <tr>
            <td>最大月 - 最小月</td>
            <td>{formatDiff(firstStats.diffMaxMin)}</td>
            <td>{formatDiff(secondStats.diffMaxMin)}</td>
            <td>
              {formatDiff(firstStats.diffMaxMin - secondStats.diffMaxMin)}
            </td>
          </tr>

          <tr>
            <td>12月 - 1月</td>
            <td>{formatDiff(firstStats.diffDecJan)}</td>
            <td>{formatDiff(secondStats.diffDecJan)}</td>
            <td>
              {formatDiff(firstStats.diffDecJan - secondStats.diffDecJan)}
            </td>
          </tr>

          <tr>
            <td>前月比で一番増えた月</td>
            <td>
              {firstStats.largestIncrease?.from}
              から
              {firstStats.largestIncrease?.to}
              ：
              {formatDiff(firstStats.largestIncrease?.diff)}
            </td>
            <td>
              {secondStats.largestIncrease?.from}
              から
              {secondStats.largestIncrease?.to}
              ：
              {formatDiff(secondStats.largestIncrease?.diff)}
            </td>
            <td>
              {formatDiff(
                firstStats.largestIncrease?.diff -
                  secondStats.largestIncrease?.diff
              )}
            </td>
          </tr>

          {pairStats?.largestDifference && (
            <tr>
              <td>差が一番大きい月</td>
              <td colSpan="3">
                {pairStats.largestDifference.month}：
                {firstName} - {secondName}
                ＝{formatDiff(pairStats.largestDifference.diff)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MultiMeshComparisonTable({ meshes, stats }) {
  if (!stats?.length) return null;

  const rows = [
    ["最大", (item) => `${item.maxMonth}：${formatNumber(item.maxValue)}人`],
    ["最小", (item) => `${item.minMonth}：${formatNumber(item.minValue)}人`],
    ["平均", (item) => `${formatNumber(item.average)}人`],
    ["最大月 - 最小月", (item) => formatDiff(item.diffMaxMin)],
    ["12月 - 1月", (item) => formatDiff(item.diffDecJan)],
  ];

  return (
    <div className="comparisonTableBox">
      <h3 className="comparisonSubTitle">地点比較表</h3>
      <table className="comparisonTable">
        <thead>
          <tr>
            <th>項目</th>
            {meshes.map((mesh) => (
              <th key={mesh.id} style={{ color: mesh.color }}>
                {mesh.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, formatter]) => (
            <tr key={label}>
              <td>{label}</td>
              {stats.map((item, index) => (
                <td key={meshes[index].id}>{formatter(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MeshComparisonPanel({
  selectedMeshIds,
  selectedMeshColorSlots,
  dayflag,
  timezone,
  getPlaceName,
  onClear,
  isMinimized,
  onToggleMinimize,
}) {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hiddenMeshIds, setHiddenMeshIds] = useState([]);
  const [singleComparisonMeshId, setSingleComparisonMeshId] = useState("");

  const comparisonMeshes = selectedMeshIds.map((id, index) => ({
    id,
    key: `mesh${index}`,
    name: getPlaceName(id),
    color: selectionColors[selectedMeshColorSlots[id] ?? index],
  }));
  const visibleComparisonMeshes = comparisonMeshes.filter(
    (mesh) => !hiddenMeshIds.includes(mesh.id)
  );
  const directSingleMeshId = visibleComparisonMeshes.some(
    (mesh) => mesh.id === singleComparisonMeshId
  )
    ? singleComparisonMeshId
    : "";
  const firstMeshId = directSingleMeshId || selectedMeshIds[0];

  const isSingleMode =
    selectedMeshIds.length === 1 || Boolean(directSingleMeshId);
  const isMultiMeshMode =
    selectedMeshIds.length >= 2 && !directSingleMeshId;

  useEffect(() => {
    setHiddenMeshIds((currentIds) =>
      currentIds.filter((id) => selectedMeshIds.includes(id))
    );
  }, [selectedMeshIds]);

  useEffect(() => {
    if (selectedMeshIds.length === 0) {
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

            if (isSingleMode) {
              const daytimeTarget = rows.find(
                (row) =>
                  row.mesh1kmid === firstMeshId &&
                  row.dayflag === "0" &&
                  row.timezone === "1"
              );

              const nighttimeTarget = rows.find(
                (row) =>
                  row.mesh1kmid === firstMeshId &&
                  row.dayflag === "0" &&
                  row.timezone === "2"
              );

              const weekdayTarget = rows.find(
                (row) =>
                  row.mesh1kmid === firstMeshId &&
                  row.dayflag === "1" &&
                  row.timezone === "0"
              );

              const holidayTarget = rows.find(
                (row) =>
                  row.mesh1kmid === firstMeshId &&
                  row.dayflag === "2" &&
                  row.timezone === "0"
              );

              return {
                month: month.label,
                monthValue: month.value,
                daytime: daytimeTarget ? daytimeTarget.population : 0,
                nighttime: nighttimeTarget
                  ? nighttimeTarget.population
                  : 0,
                weekday: weekdayTarget ? weekdayTarget.population : 0,
                holiday: holidayTarget ? holidayTarget.population : 0,
              };
            }

            return selectedMeshIds.reduce((item, meshId, index) => {
              const target = rows.find(
                (row) =>
                  row.mesh1kmid === meshId &&
                  row.dayflag === dayflag &&
                  row.timezone === timezone
              );

              item[`mesh${index}`] = target ? target.population : 0;
              return item;
            }, {
              month: month.label,
              monthValue: month.value,
            });
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
  }, [
    selectedMeshIds,
    firstMeshId,
    dayflag,
    timezone,
    isSingleMode,
  ]);

  const stats = useMemo(() => {
    if (monthlyData.length === 0) {
      return null;
    }

    if (isSingleMode) {
      const daytimeStats = createMeshStats(monthlyData, "daytime");
      const nighttimeStats = createMeshStats(monthlyData, "nighttime");
      const weekdayStats = createMeshStats(monthlyData, "weekday");
      const holidayStats = createMeshStats(monthlyData, "holiday");

      return {
        daytimeStats,
        nighttimeStats,
        weekdayStats,
        holidayStats,
        daytimeNighttimePairStats: createPairDiffStats(
          monthlyData,
          "daytime",
          "nighttime"
        ),
        weekdayHolidayPairStats: createPairDiffStats(
          monthlyData,
          "weekday",
          "holiday"
        ),
      };
    }

    return {
      meshStats: visibleComparisonMeshes.map((mesh) =>
        createMeshStats(monthlyData, mesh.key)
      ),
      pairStats:
        visibleComparisonMeshes.length === 2
          ? createPairDiffStats(
              monthlyData,
              visibleComparisonMeshes[0].key,
              visibleComparisonMeshes[1].key
            )
          : null,
    };
  }, [monthlyData, isSingleMode, visibleComparisonMeshes]);

  const comparisonYAxis = useMemo(() => {
    const maxValue = Math.max(
      0,
      ...monthlyData.flatMap((item) =>
        comparisonMeshes.map((mesh) => item[mesh.key] ?? 0)
      )
    );

    if (maxValue === 0) {
      return { max: 1, ticks: [0, 1] };
    }

    const roughStep = maxValue / 4;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalized = roughStep / magnitude;
    let niceMultiplier;

    if (normalized <= 1) niceMultiplier = 1;
    else if (normalized <= 1.5) niceMultiplier = 1.5;
    else if (normalized <= 2) niceMultiplier = 2;
    else if (normalized <= 2.5) niceMultiplier = 2.5;
    else if (normalized <= 5) niceMultiplier = 5;
    else if (normalized <= 7.5) niceMultiplier = 7.5;
    else niceMultiplier = 10;

    const step = niceMultiplier * magnitude;
    const max = step * 4;
    const ticks = Array.from({ length: 5 }, (_, index) => index * step);

    return { max, ticks };
  }, [monthlyData, comparisonMeshes]);

  if (selectedMeshIds.length === 0) {
    return (
      <section className="comparisonPanel">
        <h2>メッシュ比較</h2>
        <p>
          地図上のメッシュをクリックすると、
          1地点の昼夜・平日休日比較ができます。
          2つ選択すると、2地点の月別推移を比較できます。
        </p>
      </section>
    );
  }

  return (
    <section className="comparisonPanel">
      <div className="comparisonHeader">
        <h2>メッシュ比較</h2>

        <div className="comparisonHeaderActions">
          <button
            type="button"
            className="drawerToggleButton"
            onClick={onToggleMinimize}
            aria-label={isMinimized ? "分析パネルを開く" : "分析パネルを縮小"}
            title={isMinimized ? "分析パネルを開く" : "分析パネルを縮小"}
          >
            <span
              className={`drawerToggleIcon ${isMinimized ? "up" : "down"}`}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            className="comparisonCloseButton"
            onClick={onClear}
            aria-label="メッシュ選択を解除して閉じる"
            title="メッシュ選択を解除して閉じる"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>

      <label className="singleComparisonControl">
        <span>1地点比較</span>
        <select
          value={directSingleMeshId}
          style={{
            color:
              comparisonMeshes.find((mesh) => mesh.id === directSingleMeshId)
                ?.color || undefined,
          }}
          onChange={(event) => {
            const meshId = event.target.value;
            setSingleComparisonMeshId(meshId);
            if (meshId) {
              setHiddenMeshIds((currentIds) =>
                currentIds.filter((id) => id !== meshId)
              );
            }
          }}
        >
          <option value="">オフ</option>
          {comparisonMeshes.map((mesh) => (
            <option key={mesh.id} value={mesh.id}>
              {mesh.name}
            </option>
          ))}
        </select>
      </label>

      <div className="selectedMeshList">
        {comparisonMeshes.map((mesh) => (
          <div
            key={mesh.id}
            className={hiddenMeshIds.includes(mesh.id) ? "hiddenMesh" : ""}
            style={{ "--mesh-color": mesh.color }}
          >
            <span>{mesh.name}</span>
            <button
              type="button"
              className={hiddenMeshIds.includes(mesh.id) ? "active" : ""}
              onClick={() => {
                if (directSingleMeshId === mesh.id) {
                  setSingleComparisonMeshId("");
                }
                setHiddenMeshIds((currentIds) =>
                  currentIds.includes(mesh.id)
                    ? currentIds.filter((id) => id !== mesh.id)
                    : [...currentIds, mesh.id]
                );
              }}
            >
              {hiddenMeshIds.includes(mesh.id) ? "表示" : "非表示"}
            </button>
          </div>
        ))}
      </div>

      {isSingleMode && (
        <p className="comparisonCondition">
          1地点比較：昼間・夜間 / 平日・休日
        </p>
      )}

      {isMultiMeshMode && (
        <p className="comparisonCondition">
          {selectedMeshIds.length}地点比較条件：
          {dayflagLabels[dayflag]} / {timezoneLabels[timezone]}
        </p>
      )}

      {isSingleMode && selectedMeshIds.length === 1 && (
        <p className="comparisonNote">
          もう1つメッシュをクリックすると、2地点比較に切り替わります。
        </p>
      )}

      {loading && <p>月別データを読み込み中...</p>}

      {error && <p className="error">{error}</p>}

      {selectedMeshIds.length >= 2 && visibleComparisonMeshes.length === 0 && (
        <p className="comparisonNote">
          すべての地点が一時的に非表示です。
        </p>
      )}

      {!loading && monthlyData.length > 0 && isSingleMode && stats && (
        <>
          <h3 className="comparisonSubTitle">昼間・夜間比較</h3>

          <div className="lineChartBox">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />

                <Line
                  type="linear"
                  dataKey="daytime"
                  name="昼間"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />

                <Line
                  type="linear"
                  dataKey="nighttime"
                  name="夜間"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ComparisonTable
            title="昼間・夜間比較表"
            firstName="昼間"
            secondName="夜間"
            firstStats={stats.daytimeStats}
            secondStats={stats.nighttimeStats}
            pairStats={stats.daytimeNighttimePairStats}
          />

          <h3 className="comparisonSubTitle">平日・休日比較</h3>

          <div className="lineChartBox">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />

                <Line
                  type="linear"
                  dataKey="weekday"
                  name="平日"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />

                <Line
                  type="linear"
                  dataKey="holiday"
                  name="休日"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ComparisonTable
            title="平日・休日比較表"
            firstName="平日"
            secondName="休日"
            firstStats={stats.weekdayStats}
            secondStats={stats.holidayStats}
            pairStats={stats.weekdayHolidayPairStats}
          />
        </>
      )}

      {!loading &&
        monthlyData.length > 0 &&
        isMultiMeshMode &&
        visibleComparisonMeshes.length > 0 &&
        stats && (
        <>
          <div className="lineChartBox">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  domain={[0, comparisonYAxis.max]}
                  ticks={comparisonYAxis.ticks}
                  allowDecimals={false}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />

                {visibleComparisonMeshes.map((mesh) => (
                  <Line
                    key={mesh.id}
                    type="linear"
                    dataKey={mesh.key}
                    name={mesh.name}
                    stroke={mesh.color}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 7 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <MultiMeshComparisonTable
            meshes={visibleComparisonMeshes}
            stats={stats.meshStats}
          />
        </>
      )}
    </section>
  );
}

export default MeshComparisonPanel;
