import Legend from "./Legend.jsx";

function RankingPanel({ ranking, getPlaceName }) {
  return (
    <aside className="sidePanel">
      <h2>人口上位メッシュ</h2>

      {ranking.map((item, index) => (
        <div className="rankItem" key={item.mesh1kmid}>
          <div>
            <strong>{index + 1}位</strong>

            <p>{getPlaceName(item.mesh1kmid)}</p>

            <p>メッシュID：{item.mesh1kmid}</p>
          </div>

          <span>{item.population.toLocaleString()}人</span>
        </div>
      ))}

      <Legend />
    </aside>
  );
}

export default RankingPanel;