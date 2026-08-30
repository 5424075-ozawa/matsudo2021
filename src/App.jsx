import { useEffect, useMemo, useRef, useState } from "react";

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
  const legendRef = useRef(null);
  const [legendHeight, setLegendHeight] = useState(0);
  const [month, setMonth] = useState("01");
  const [dayflag, setDayflag] = useState("0");
  const [timezone, setTimezone] = useState("0");
  const [selectedArea, setSelectedArea] = useState("tokatsu");

  const [showStations, setShowStations] = useState(true);
  const [showCommercialFacilities, setShowCommercialFacilities] = useState(true);
  const [activePanel, setActivePanel] = useState("ranking");
  const [comparisonMinimized, setComparisonMinimized] = useState(false);
  const [comparisonHeight, setComparisonHeight] = useState(75);

  const [selectedMeshIds, setSelectedMeshIds] = useState([]);
  const [selectedMeshColorSlots, setSelectedMeshColorSlots] = useState({});
  const [meshFocusRequest, setMeshFocusRequest] = useState({
    meshId: null,
    requestId: 0,
  });

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
      .slice(0, 10);
  }, [filteredData]);

  useEffect(() => {
    if (!legendRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setLegendHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
    });

    observer.observe(legendRef.current);
    return () => observer.disconnect();
  }, []);

  function handleMeshSelect(meshId) {
    setSelectedMeshIds((currentIds) => {
      let nextIds;

      if (currentIds.includes(meshId)) {
        nextIds = currentIds.filter((id) => id !== meshId);
        setSelectedMeshColorSlots((currentSlots) => {
          const nextSlots = { ...currentSlots };
          delete nextSlots[meshId];
          return nextSlots;
        });
      } else if (currentIds.length >= 5) {
        nextIds = currentIds;
      } else {
        nextIds = [...currentIds, meshId];
        setSelectedMeshColorSlots((currentSlots) => {
          const usedSlots = new Set(
            currentIds.map((id) => currentSlots[id]).filter(Number.isInteger)
          );
          const availableSlot = [0, 1, 2, 3, 4].find(
            (slot) => !usedSlots.has(slot)
          );

          return { ...currentSlots, [meshId]: availableSlot };
        });
      }

      setActivePanel(nextIds.length > 0 ? "comparison" : null);
      setComparisonMinimized(false);
      return nextIds;
    });
  }

  function clearSelectedMeshes() {
    setSelectedMeshIds([]);
    setSelectedMeshColorSlots({});
    setActivePanel(null);
    setComparisonMinimized(false);
  }

  function handleRankingMeshSelect(meshId) {
    handleMeshSelect(meshId);
    setMeshFocusRequest((current) => ({
      meshId,
      requestId: current.requestId + 1,
    }));
  }

  function resizeComparisonDrawer(event) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

    const mapStage = event.currentTarget.closest(".mapStage");
    const bounds = mapStage.getBoundingClientRect();
    const nextHeight = ((bounds.bottom - event.clientY) / bounds.height) * 100;

    setComparisonHeight(Math.min(90, Math.max(20, nextHeight)));
  }

  return (
    <div className="page">
      <main
        className={`mapStage ${
          activePanel === "comparison" ? "comparisonActive" : ""
        }`}
        style={{ "--legend-height": `${legendHeight}px` }}
      >
        <FlowMap
          data={filteredData}
          fitArea={loadedArea}
          maxPopulation={statistics.maxPopulation}
          getPlaceName={getPlaceName}
          showStations={showStations}
          showCommercialFacilities={showCommercialFacilities}
          selectedMeshIds={selectedMeshIds}
          selectedMeshColorSlots={selectedMeshColorSlots}
          meshFocusRequest={meshFocusRequest}
          onMeshSelect={handleMeshSelect}
          onMapInteraction={() => {
            if (activePanel === "comparison") {
              setComparisonMinimized(true);
            }
          }}
        />

        <div className="mapTopLeft">
          <Header />

          <ControlPanel
            month={month}
            dayflag={dayflag}
            timezone={timezone}
            selectedArea={selectedArea}
            showStations={showStations}
            showCommercialFacilities={showCommercialFacilities}
            onMonthChange={(event) => setMonth(event.target.value)}
            onDayflagChange={(event) => setDayflag(event.target.value)}
            onTimezoneChange={(event) => setTimezone(event.target.value)}
            onAreaChange={(event) => {
              setSelectedArea(event.target.value);
              setSelectedMeshIds([]);
              setSelectedMeshColorSlots({});
            }}
            onShowStationsChange={() =>
              setShowStations((current) => !current)
            }
            onShowCommercialFacilitiesChange={() =>
              setShowCommercialFacilities((current) => !current)
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
        </div>

        {activePanel && (
          <div
            className={`mapAnalysisPanel ${
              activePanel === "comparison" ? "comparisonDrawer" : ""
            } ${activePanel === "ranking" ? "rankingPanelContainer" : ""
            } ${comparisonMinimized ? "minimized" : ""}`}
            style={{ "--comparison-height": `${comparisonHeight}%` }}
          >
            {activePanel === "comparison" && !comparisonMinimized && (
              <div
                className="comparisonResizeHandle"
                role="separator"
                aria-label="比較パネルの高さを変更"
                aria-orientation="horizontal"
                tabIndex="0"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={resizeComparisonDrawer}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setComparisonHeight((height) => Math.min(90, height + 5));
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setComparisonHeight((height) => Math.max(20, height - 5));
                  }
                }}
              />
            )}
            {activePanel === "ranking" && (
              <RankingPanel
                ranking={ranking}
                getPlaceName={getPlaceName}
                onMeshSelect={handleRankingMeshSelect}
                onClose={() => setActivePanel(null)}
              />
            )}
            {activePanel === "comparison" && (
              <MeshComparisonPanel
                selectedMeshIds={selectedMeshIds}
                selectedMeshColorSlots={selectedMeshColorSlots}
                dayflag={dayflag}
                timezone={timezone}
                getPlaceName={getPlaceName}
                onClear={clearSelectedMeshes}
                isMinimized={comparisonMinimized}
                onToggleMinimize={() =>
                  setComparisonMinimized((current) => !current)
                }
              />
            )}
          </div>
        )}

        <aside ref={legendRef} className="mapLegend" aria-label="地図の凡例">
          <Legend
            maxPopulation={statistics.maxPopulation}
            showCommercialFacilities={showCommercialFacilities}
          />
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
