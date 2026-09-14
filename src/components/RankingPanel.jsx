import { useEffect, useMemo, useState } from "react";

function RankingPanel({ ranking, getPlaceName, onMeshSelect, onClose, isDifferenceMode }) {
  const [differenceFilter, setDifferenceFilter] = useState("day");

  useEffect(() => {
    if (!isDifferenceMode) setDifferenceFilter("day");
  }, [isDifferenceMode]);

  const visibleRanking = useMemo(() => {
    const filtered = ranking.filter((item) => {
      if (!isDifferenceMode) return true;
      if (differenceFilter === "day") return item.population < 0;
      return item.population > 0;
    });

    return filtered.slice(0, 10);
  }, [ranking, isDifferenceMode, differenceFilter]);

  return (
    <aside className="sidePanel">
      <div className="rankingHeader">
        <h2>{isDifferenceMode ? "昼夜差の大きいエリア" : "人口上位エリア"}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="ランキングを閉じる"
          title="ランキングを閉じる"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {isDifferenceMode && (
        <div className="rankingFilter" aria-label="昼夜差ランキングの条件">
          <button
            type="button"
            className={differenceFilter === "day" ? "active day" : "day"}
            aria-pressed={differenceFilter === "day"}
            onClick={() => setDifferenceFilter("day")}
          >
            昼の方が多い
          </button>
          <button
            type="button"
            className={differenceFilter === "night" ? "active night" : "night"}
            aria-pressed={differenceFilter === "night"}
            onClick={() => setDifferenceFilter("night")}
          >
            夜の方が多い
          </button>
        </div>
      )}

      {visibleRanking.map((item, index) => (
        <button
          type="button"
          className="rankItem"
          key={item.mesh1kmid}
          onClick={() => onMeshSelect(item.mesh1kmid)}
        >
          <div>
            <strong>{index + 1}位</strong>

            <p>{getPlaceName(item.mesh1kmid)}</p>
          </div>

          <span>
            {isDifferenceMode && item.population > 0 ? "+" : ""}
            {item.population.toLocaleString()}人
          </span>
        </button>
      ))}
    </aside>
  );
}

export default RankingPanel;
