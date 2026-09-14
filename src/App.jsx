import { useEffect, useMemo, useRef, useState } from "react";

import Header from "./components/Header";
import ControlPanel from "./components/ControlPanel";
import SummaryCards from "./components/SummaryCards";
import FlowMap from "./components/FlowMap";
import RankingPanel from "./components/RankingPanel";
import MeshComparisonPanel from "./components/MeshComparisonPanel";
import Legend from "./components/Legend";
import PlaceSearch from "./components/PlaceSearch";
import TutorialOverlay from "./components/TutorialOverlay";

import { useFlowData } from "./hooks/useFlowData";
import { usePlaceNames } from "./hooks/usePlaceNames";

function App() {
  const legendRef = useRef(null);
  const footerTransitionTimerRef = useRef(null);
  const [legendHeight, setLegendHeight] = useState(0);
  const [month, setMonth] = useState("01");
  const [dayflag, setDayflag] = useState("0");
  const [timezone, setTimezone] = useState("0");
  const [selectedArea, setSelectedArea] = useState("tokatsu");

  const [showStations, setShowStations] = useState(true);
  const [showCommercialFacilities, setShowCommercialFacilities] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [footerCollapsing, setFooterCollapsing] = useState(false);
  const [headerMinimized, setHeaderMinimized] = useState(false);
  const [activePanel, setActivePanel] = useState("ranking");
  const [comparisonMinimized, setComparisonMinimized] = useState(false);
  const [comparisonHeight, setComparisonHeight] = useState(75);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      return window.localStorage.getItem("flow-map-tutorial-complete") !== "true";
    } catch {
      return true;
    }
  });

  const [selectedMeshIds, setSelectedMeshIds] = useState([]);
  const [selectedMeshColorSlots, setSelectedMeshColorSlots] = useState({});
  const [meshFocusRequest, setMeshFocusRequest] = useState({
    meshId: null,
    requestId: 0,
  });
  const [pointFocusRequest, setPointFocusRequest] = useState({
    lat: null,
    lng: null,
    requestId: 0,
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 900px)");
    const restoreFooterOnDesktop = (event) => {
      if (!event.matches) {
        clearTimeout(footerTransitionTimerRef.current);
        setFooterCollapsing(false);
        setShowFooter(true);
      }
    };

    mobileQuery.addEventListener("change", restoreFooterOnDesktop);
    return () => mobileQuery.removeEventListener("change", restoreFooterOnDesktop);
  }, []);

  useEffect(() => {
    const updateViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        "--app-viewport-height",
        `${viewportHeight}px`
      );
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("resize", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      document.documentElement.style.removeProperty("--app-viewport-height");
    };
  }, []);

  useEffect(
    () => () => clearTimeout(footerTransitionTimerRef.current),
    []
  );

  function toggleFooter() {
    if (!showFooter) {
      setShowFooter(true);
      return;
    }

    if (footerCollapsing) return;

    setFooterCollapsing(true);
    footerTransitionTimerRef.current = setTimeout(() => {
      setShowFooter(false);
      setFooterCollapsing(false);
    }, 360);
  }

  function closeTutorial() {
    setShowTutorial(false);
    setTutorialStep(0);
    try {
      window.localStorage.setItem("flow-map-tutorial-complete", "true");
    } catch {
      // The tutorial still closes when browser storage is unavailable.
    }
  }

  const {
    data: allData,
    loadedArea,
    loading,
    error,
  } = useFlowData(month, selectedArea);

  const filteredData = useMemo(() => {
    if (timezone === "difference") {
      const targetRows = allData.filter((item) => item.dayflag === dayflag);
      const daytimeByMesh = new Map(
        targetRows
          .filter((item) => item.timezone === "1")
          .map((item) => [item.mesh1kmid, item])
      );
      const nighttimeByMesh = new Map(
        targetRows
          .filter((item) => item.timezone === "2")
          .map((item) => [item.mesh1kmid, item])
      );
      const meshIds = new Set([...daytimeByMesh.keys(), ...nighttimeByMesh.keys()]);

      return [...meshIds].map((meshId) => {
        const daytime = daytimeByMesh.get(meshId);
        const nighttime = nighttimeByMesh.get(meshId);
        const base = nighttime ?? daytime;
        const daytimePopulation = daytime?.population ?? 0;
        const nighttimePopulation = nighttime?.population ?? 0;

        return {
          ...base,
          timezone: "difference",
          daytimePopulation,
          nighttimePopulation,
          population: nighttimePopulation - daytimePopulation,
        };
      });
    }

    return allData.filter(
      (item) =>
        item.dayflag === dayflag &&
        item.timezone === timezone
    );
  }, [allData, dayflag, timezone]);

  const { getPlaceName } = usePlaceNames();

  const statistics = useMemo(() => {
    const totalPopulation = filteredData.reduce(
      (sum, item) => sum + item.population,
      0
    );

    const maxPopulation =
      filteredData.length > 0
        ? Math.max(...filteredData.map((item) => Math.abs(item.population)))
        : 0;

    const averagePopulation =
      filteredData.length > 0
        ? Math.round(totalPopulation / filteredData.length)
        : 0;

    return {
      totalPopulation,
      maxPopulation,
      averagePopulation,
      nighttimeIncreaseCount: filteredData.filter((item) => item.population > 0).length,
      daytimeIncreaseCount: filteredData.filter((item) => item.population < 0).length,
      maxNighttimeIncrease: Math.max(0, ...filteredData.map((item) => item.population)),
      maxDaytimeIncrease: Math.max(0, ...filteredData.map((item) => -item.population)),
    };
  }, [filteredData]);

  const ranking = useMemo(() => {
    return [...filteredData]
      .sort((a, b) =>
        timezone === "difference"
          ? Math.abs(b.population) - Math.abs(a.population)
          : b.population - a.population
      );
  }, [filteredData, timezone]);

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
      <div
        className={`mapTopLeft mapTopBar ${
          headerMinimized ? "minimized" : ""
        }`}
      >
        <Header
          minimized={headerMinimized}
          onToggleMinimize={() => setHeaderMinimized((current) => !current)}
          onOpenTutorial={() => {
            setHeaderMinimized(false);
            setTutorialStep(0);
            setShowTutorial(true);
          }}
        />

        <div className="headerCollapsibleContent">
          <div className="headerCollapsibleInner">
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
          onShowStationsChange={() => setShowStations((current) => !current)}
          onShowCommercialFacilitiesChange={() =>
            setShowCommercialFacilities((current) => !current)
          }
            />

            <div className="panelSwitcher" aria-label="分析パネル切り替え">
              <PlaceSearch
            data={filteredData}
            onSelect={(place) => {
              if (place.type === "station") setShowStations(true);
              if (place.type === "facility") setShowCommercialFacilities(true);
              setPointFocusRequest((current) => ({
                lat: place.lat,
                lng: place.lng,
                requestId: current.requestId + 1,
              }));
            }}
              />
              <button
            type="button"
            className={`displayToggleButton rankingToggle ${
              activePanel === "ranking" ? "active" : ""
            }`}
            onClick={() =>
              setActivePanel(activePanel === "ranking" ? null : "ranking")
            }
              >
                ランキング
              </button>
            </div>
          </div>
        </div>
      </div>

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
          pointFocusRequest={pointFocusRequest}
          onMeshSelect={handleMeshSelect}
          onMapInteraction={() => {
            if (activePanel === "comparison") {
              setComparisonMinimized(true);
            }
          }}
        />

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
                isDifferenceMode={timezone === "difference"}
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

        <aside
          ref={legendRef}
          className={`mapLegend ${showLegend ? "visible" : "hidden"}`}
          aria-label="地図の凡例"
          aria-hidden={!showLegend}
        >
          <Legend
            maxPopulation={statistics.maxPopulation}
            isDifferenceMode={timezone === "difference"}
            timezone={timezone}
            showCommercialFacilities={showCommercialFacilities}
            onClose={() => setShowLegend(false)}
          />
        </aside>

        <button
          type="button"
          className={`displayToggleButton legendRestoreButton ${
            showLegend ? "hidden" : "visible"
          }`}
          onClick={(event) => {
            event.currentTarget.blur();
            setShowLegend(true);
          }}
          aria-hidden={showLegend}
          tabIndex={showLegend ? -1 : 0}
        >
          凡例
        </button>

        <div className="mapSummary">
          <SummaryCards
            month={month}
            dayflag={dayflag}
            timezone={timezone}
            meshCount={filteredData.length}
            totalPopulation={statistics.totalPopulation}
            maxPopulation={statistics.maxPopulation}
            averagePopulation={statistics.averagePopulation}
            isDifferenceMode={timezone === "difference"}
            nighttimeIncreaseCount={statistics.nighttimeIncreaseCount}
            daytimeIncreaseCount={statistics.daytimeIncreaseCount}
            maxNighttimeIncrease={statistics.maxNighttimeIncrease}
            maxDaytimeIncrease={statistics.maxDaytimeIncrease}
          />
        </div>

        {loading && <p className="mapMessage message">読み込み中...</p>}
        {error && <p className="mapMessage error">{error}</p>}
      </main>

      <footer
        className={`footer ${
          showFooter ? (footerCollapsing ? "collapsing" : "visible") : "hidden"
        }`}
      >
        <span className="footerText">
          「全国の人流オープンデータ」（国土交通省）および
          「国土数値情報 駅別乗降客数データ」（国土交通省）、
          商業施設・背景地図 © OpenStreetMap contributors（ODbL）を加工して作成
        </span>
        <button
          type="button"
          className="footerCloseButton"
          onClick={toggleFooter}
          aria-expanded={showFooter}
          aria-label={showFooter ? "出典を収納" : "出典を展開"}
          title={showFooter ? "出典を収納" : "出典を展開"}
        >
          <span
            className={`drawerToggleIcon ${showFooter ? "down" : "up"}`}
            aria-hidden="true"
          />
        </button>
      </footer>

      {showTutorial && (
        <TutorialOverlay
          step={tutorialStep}
          onNext={() => setTutorialStep((current) => Math.min(3, current + 1))}
          onBack={() => setTutorialStep((current) => Math.max(0, current - 1))}
          onClose={closeTutorial}
        />
      )}
    </div>
  );
}

export default App;
