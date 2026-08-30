function Legend({ maxPopulation, showCommercialFacilities }) {
  const ranges = [
    "0%〜10%未満",
    "10%〜20%未満",
    "20%〜40%未満",
    "40%〜60%未満",
    "60%〜80%未満",
    "80%以上",
  ];

  return (
    <div className="legend">
      <h2>凡例</h2>

      {maxPopulation === 0 ? (
        <div>表示できる人口データがありません</div>
      ) : (
        ranges.map((label, index) => (
          <div key={label}>
            <span className={`box c${index + 1}`}></span>
            {label}
          </div>
        ))
      )}

      {showCommercialFacilities && (
        <section className="facilityLegend" aria-label="商業施設の規模">
          <h3>商業施設</h3>
          <div>
            <span className="facilityLegendPin large"></span>
            大（20,000㎡以上）
          </div>
          <div>
            <span className="facilityLegendPin medium"></span>
            中（5,000〜20,000㎡未満）
          </div>
          <div>
            <span className="facilityLegendPin small"></span>
            小（5,000㎡未満）
          </div>
          <div>
            <span className="facilityLegendPin unknown"></span>
            面積不明
          </div>
        </section>
      )}
    </div>
  );
}

export default Legend;
