function RankingPanel({ ranking, getPlaceName, onMeshSelect, onClose }) {
  return (
    <aside className="sidePanel">
      <div className="rankingHeader">
        <h2>人口上位メッシュ</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="ランキングを閉じる"
          title="ランキングを閉じる"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {ranking.map((item, index) => (
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

          <span>{item.population.toLocaleString()}人</span>
        </button>
      ))}
    </aside>
  );
}

export default RankingPanel;
