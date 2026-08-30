import { useMemo, useState } from "react";

import Header from "./components/Header";
import ControlPanel from "./components/ControlPanel";
import SummaryCards from "./components/SummaryCards";
import FlowMap from "./components/FlowMap";
import RankingPanel from "./components/RankingPanel";
import MeshComparisonPanel from "./components/MeshComparisonPanel";
import Legend from "./components/Legend";

import { useFlowData } from "./hooks/useFlowData";
import { usePlaceNames } from "./hooks/usePlaceNames";

function App() {
  const [month, setMonth] = useState("01");
  const [dayflag, setDayflag] = useState("0");
  const [timezone, setTimezone] = useState("0");
  const [selectedArea, setSelectedArea] = useState("tokatsu");

  const [showMesh, setShowMesh] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [activePanel, setActivePanel] = useState("ranking");

  const [selectedMeshIds, setSelectedMeshIds] = useState([]);

  const {
    data: allData,
    loadedArea,
    loading,
    error,
  } = useFlowData(month, selectedArea);

  const filteredData = useMemo(() => {
    return allData.filter(
      (item) =>
        item.dayflag === dayflag &&
        item.timezone === timezone
    );
  }, [allData, dayflag, timezone]);

  const { getPlaceName } = usePlaceNames(filteredData);

  const statistics = useMemo(() => {
    const totalPopulation = filteredData.reduce(
      (sum, item) => sum + item.population,
      0
    );

    const maxPopulation =
      filteredData.length > 0
        ? Math.max(...filteredData.map((item) => item.population))
        : 0;

    const averagePopulation =
      filteredData.length > 0
        ? Math.round(totalPopulation / filteredData.length)
        : 0;

    return {
      totalPopulation,
      maxPopulation,
      averagePopulation,
    };
  }, [filteredData]);

  const ranking = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.population - a.population)
      .slice(0, 5);
  }, [filteredData]);

  function handleMeshSelect(meshId) {
    setSelectedMeshIds((currentIds) => {
      if (currentIds.includes(meshId)) {
        return currentIds.filter((id) => id !== meshId);
      }

      if (currentIds.length >= 2) {
        return [currentIds[1], meshId];
      }

      return [...currentIds, meshId];
    });
  }

  function clearSelectedMeshes() {
    setSelectedMeshIds([]);
  }

  return (
    <div className="page">
      <main className="mapStage">
        <FlowMap
          data={filteredData}
          fitArea={loadedArea}
          maxPopulation={statistics.maxPopulation}
          getPlaceName={getPlaceName}
          showMesh={showMesh}
          showStations={showStations}
          selectedMeshIds={selectedMeshIds}
          onMeshSelect={handleMeshSelect}
        />

        <div className="mapTopLeft">
          <Header />

          <ControlPanel
            month={month}
            dayflag={dayflag}
            timezone={timezone}
            selectedArea={selectedArea}
            showMesh={showMesh}
            showStations={showStations}
            onMonthChange={(event) => setMonth(event.target.value)}
            onDayflagChange={(event) => setDayflag(event.target.value)}
            onTimezoneChange={(event) => setTimezone(event.target.value)}
            onAreaChange={(event) => {
              setSelectedArea(event.target.value);
              setSelectedMeshIds([]);
            }}
            onShowMeshChange={(event) => setShowMesh(event.target.checked)}
            onShowStationsChange={(event) =>
              setShowStations(event.target.checked)
            }
          />
        </div>

        <div className="panelSwitcher" aria-label="分析パネル切り替え">
          <button
            type="button"
            className={activePanel === "ranking" ? "active" : ""}
            onClick={() =>
              setActivePanel(activePanel === "ranking" ? null : "ranking")
            }
          >
            ランキング
          </button>
          <button
            type="button"
            className={activePanel === "comparison" ? "active" : ""}
            onClick={() =>
              setActivePanel(
                activePanel === "comparison" ? null : "comparison"
              )
            }
          >
            メッシュ分析
          </button>
        </div>

        {activePanel && (
          <div className="mapAnalysisPanel">
            {activePanel === "ranking" && (
              <RankingPanel
                ranking={ranking}
                getPlaceName={getPlaceName}
              />
            )}
            {activePanel === "comparison" && (
              <MeshComparisonPanel
                selectedMeshIds={selectedMeshIds}
                dayflag={dayflag}
                timezone={timezone}
                getPlaceName={getPlaceName}
                onClear={clearSelectedMeshes}
              />
            )}
          </div>
        )}

        <aside className="mapLegend" aria-label="人口の凡例">
          <Legend maxPopulation={statistics.maxPopulation} />
        </aside>

        <div className="mapSummary">
          <SummaryCards
            month={month}
            dayflag={dayflag}
            timezone={timezone}
            meshCount={filteredData.length}
            totalPopulation={statistics.totalPopulation}
            maxPopulation={statistics.maxPopulation}
            averagePopulation={statistics.averagePopulation}
          />
        </div>

        {loading && <p className="mapMessage message">読み込み中...</p>}
        {error && <p className="mapMessage error">{error}</p>}
      </main>

      <footer className="footer">
        「全国の人流オープンデータ」（国土交通省）および
        「国土数値情報 駅別乗降客数データ」（国土交通省）を加工して作成
      </footer>
    </div>
  );
}

export default App;
