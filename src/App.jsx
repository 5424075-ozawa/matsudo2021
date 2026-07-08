import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Rectangle, Popup } from "react-leaflet";

const dayflagLabels = {
  0: "全日",
  1: "平日",
  2: "休日",
};

const timezoneLabels = {
  0: "終日",
  1: "昼",
  2: "夜",
};

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

function mesh1kmToBounds(meshId) {
  const code = String(meshId);

  const p = Number(code.slice(0, 2));
  const q = Number(code.slice(2, 4));
  const r = Number(code.slice(4, 5));
  const s = Number(code.slice(5, 6));
  const t = Number(code.slice(6, 7));
  const u = Number(code.slice(7, 8));

  const south = p / 1.5 + r * (5 / 60) + t * (30 / 3600);
  const west = q + 100 + s * (7.5 / 60) + u * (45 / 3600);

  const north = south + 30 / 3600;
  const east = west + 45 / 3600;

  return [
    [south, west],
    [north, east],
  ];
}

function mesh1kmToCenter(meshId) {
  const bounds = mesh1kmToBounds(meshId);

  const south = bounds[0][0];
  const west = bounds[0][1];
  const north = bounds[1][0];
  const east = bounds[1][1];

  return {
    lat: (south + north) / 2,
    lng: (west + east) / 2,
  };
}

async function fetchPlaceName(meshId) {
  const center = mesh1kmToCenter(meshId);

  try {
    const url = `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${center.lat}&lon=${center.lng}`;

    const res = await fetch(url);
    const json = await res.json();

    return json.results?.lv01Nm || "地名取得不可";
  } catch (error) {
    console.error("地名取得エラー:", error);
    return "地名取得不可";
  }
}

function getColor(value, max) {
  if (max === 0) return "#eeeeee";

  const ratio = value / max;

  if (ratio > 0.8) return "#800026";
  if (ratio > 0.6) return "#BD0026";
  if (ratio > 0.4) return "#E31A1C";
  if (ratio > 0.2) return "#FC4E2A";
  if (ratio > 0.1) return "#FD8D3C";
  return "#FEB24C";
}

function App() {
  const [allData, setAllData] = useState([]);
  const [month, setMonth] = useState("01");
  const [dayflag, setDayflag] = useState("0");
  const [timezone, setTimezone] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [placeNames, setPlaceNames] = useState({});

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(`/data/2021/${month}/monthly_mdp_mesh1km.csv`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("CSVファイルが見つかりません");
        }
        return res.text();
      })
      .then((text) => {
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",");

        const rows = lines.slice(1).map((line) => {
          const values = line.split(",");
          const obj = {};

          headers.forEach((h, i) => {
            obj[h.trim()] = values[i]?.trim();
          });

          obj.population = Number(obj.population);
          return obj;
        });

        const matsudo = rows.filter((d) => d.citycode === "12207");

        setAllData(matsudo);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setAllData([]);
        setError(
          "CSVの読み込みに失敗しました。public/data/2021 配下の月フォルダを確認してください。"
        );
        setLoading(false);
      });
  }, [month]);

  const filteredData = allData.filter(
    (d) => d.dayflag === dayflag && d.timezone === timezone
  );

  useEffect(() => {
    async function loadPlaceNames() {
      const newNames = {};

      for (const d of filteredData) {
        const id = String(d.mesh1kmid);

        if (!placeNames[id]) {
          newNames[id] = await fetchPlaceName(id);
        }
      }

      if (Object.keys(newNames).length > 0) {
        setPlaceNames((prev) => ({
          ...prev,
          ...newNames,
        }));
      }
    }

    if (filteredData.length > 0) {
      loadPlaceNames();
    }
  }, [filteredData]);

  function getMeshName(meshId) {
    return placeNames[String(meshId)] || "地名取得中...";
  }

  const totalPopulation = filteredData.reduce(
    (sum, d) => sum + d.population,
    0
  );

  const maxPopulation =
    filteredData.length > 0
      ? Math.max(...filteredData.map((d) => d.population))
      : 0;

  const averagePopulation =
    filteredData.length > 0
      ? Math.round(totalPopulation / filteredData.length)
      : 0;

  const ranking = [...filteredData]
    .sort((a, b) => b.population - a.population)
    .slice(0, 5);

  return (
    <div className="page">
      <header className="header">
        <h1>松戸市人流マップ</h1>
        <p>
          2021年の1kmメッシュ別滞在人口データを用いて、松戸市内の人流を可視化します。
        </p>
      </header>

      <section className="controls">
        <label>
          月：
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          曜日区分：
          <select
            value={dayflag}
            onChange={(e) => setDayflag(e.target.value)}
          >
            <option value="0">全日</option>
            <option value="1">平日</option>
            <option value="2">休日</option>
          </select>
        </label>

        <label>
          時間帯：
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            <option value="0">終日</option>
            <option value="1">昼</option>
            <option value="2">夜</option>
          </select>
        </label>
      </section>

      <section className="summary">
        <div className="card">
          <span>条件</span>
          <strong>
            2021年{Number(month)}月 / {dayflagLabels[dayflag]} /{" "}
            {timezoneLabels[timezone]}
          </strong>
        </div>

        <div className="card">
          <span>メッシュ数</span>
          <strong>{filteredData.length}件</strong>
        </div>

        <div className="card">
          <span>滞在人口合計</span>
          <strong>{totalPopulation.toLocaleString()}人</strong>
        </div>

        <div className="card">
          <span>最大メッシュ人口</span>
          <strong>{maxPopulation.toLocaleString()}人</strong>
        </div>

        <div className="card">
          <span>平均メッシュ人口</span>
          <strong>{averagePopulation.toLocaleString()}人</strong>
        </div>
      </section>

      {loading && <p className="message">読み込み中...</p>}
      {error && <p className="error">{error}</p>}

      <main className="main">
        <div className="mapArea">
          <MapContainer
            center={[35.7876, 139.9031]}
            zoom={12}
            style={{ height: "650px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredData.map((d) => (
              <Rectangle
                key={`${d.mesh1kmid}-${d.dayflag}-${d.timezone}`}
                bounds={mesh1kmToBounds(d.mesh1kmid)}
                pathOptions={{
                  color: "#555",
                  weight: 0.7,
                  fillColor: getColor(d.population, maxPopulation),
                  fillOpacity: 0.45,
                }}
              >
                <Popup>
                  <div>
                    <strong>{getMeshName(d.mesh1kmid)}</strong>
                    <br />
                    メッシュID：{d.mesh1kmid}
                    <br />
                    滞在人口：{d.population.toLocaleString()}人
                    <br />
                    年月：{d.year}年{Number(d.month)}月
                    <br />
                    区分：{dayflagLabels[d.dayflag]}
                    <br />
                    時間帯：{timezoneLabels[d.timezone]}
                  </div>
                </Popup>
              </Rectangle>
            ))}
          </MapContainer>
        </div>

        <aside className="sidePanel">
          <h2>人口上位メッシュ</h2>

          {ranking.map((d, index) => (
            <div className="rankItem" key={d.mesh1kmid}>
              <div>
                <strong>{index + 1}位</strong>
                <p>{getMeshName(d.mesh1kmid)}</p>
                <p>メッシュID：{d.mesh1kmid}</p>
              </div>
              <span>{d.population.toLocaleString()}人</span>
            </div>
          ))}

          <div className="legend">
            <h2>凡例</h2>
            <div>
              <span className="box c1"></span>少ない
            </div>
            <div>
              <span className="box c2"></span>やや少ない
            </div>
            <div>
              <span className="box c3"></span>中くらい
            </div>
            <div>
              <span className="box c4"></span>多い
            </div>
            <div>
              <span className="box c5"></span>かなり多い
            </div>
          </div>
        </aside>
      </main>

      <footer className="footer">
        「全国の人流オープンデータ」（国土交通省）を加工して作成
      </footer>
    </div>
  );
}

export default App;