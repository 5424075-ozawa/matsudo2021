import { useMemo, useState } from "react";

import Header from "./components/Header";
import ControlPanel from "./components/ControlPanel";
import SummaryCards from "./components/SummaryCards";
import FlowMap from "./components/FlowMap";
import RankingPanel from "./components/RankingPanel";

import { useFlowData } from "./hooks/useFlowData";
import { usePlaceNames } from "./hooks/usePlaceNames";

function App() {
  const [month, setMonth] = useState("01");
  const [dayflag, setDayflag] = useState("0");
  const [timezone, setTimezone] = useState("0");

  const {
    data: allData,
    loading,
    error,
  } = useFlowData(month);

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
        ? Math.max(
            ...filteredData.map(
              (item) => item.population
            )
          )
        : 0;

    const averagePopulation =
      filteredData.length > 0
        ? Math.round(
            totalPopulation / filteredData.length
          )
        : 0;

    return {
      totalPopulation,
      maxPopulation,
      averagePopulation,
    };
  }, [filteredData]);

  const ranking = useMemo(() => {
    return [...filteredData]
      .sort(
        (a, b) => b.population - a.population
      )
      .slice(0, 5);
  }, [filteredData]);

  return (
    <div className="page">
      <Header />

      <ControlPanel
        month={month}
        dayflag={dayflag}
        timezone={timezone}
        onMonthChange={(event) =>
          setMonth(event.target.value)
        }
        onDayflagChange={(event) =>
          setDayflag(event.target.value)
        }
        onTimezoneChange={(event) =>
          setTimezone(event.target.value)
        }
      />

      <SummaryCards
        month={month}
        dayflag={dayflag}
        timezone={timezone}
        meshCount={filteredData.length}
        totalPopulation={statistics.totalPopulation}
        maxPopulation={statistics.maxPopulation}
        averagePopulation={statistics.averagePopulation}
      />

      {loading && (
        <p className="message">
          読み込み中...
        </p>
      )}

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <main className="main">
        <FlowMap
          data={filteredData}
          maxPopulation={statistics.maxPopulation}
          getPlaceName={getPlaceName}
        />

        <RankingPanel
          ranking={ranking}
          getPlaceName={getPlaceName}
        />
      </main>

      <footer className="footer">
        「全国の人流オープンデータ」
        （国土交通省）を加工して作成
      </footer>
    </div>
  );
}

export default App;