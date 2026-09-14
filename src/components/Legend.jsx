function Legend({ maxPopulation, showCommercialFacilities, onClose, isDifferenceMode, timezone }) {
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
      <div className="legendHeader">
        <h2>凡例</h2>
        <button
          type="button"
          className="legendCloseButton"
          onClick={(event) => {
            event.currentTarget.blur();
            onClose();
          }}
          aria-label="凡例を閉じる"
          title="凡例を閉じる"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {maxPopulation === 0 ? (
        <div>表示できる人口データがありません</div>
      ) : isDifferenceMode ? (
        <div className="differenceLegend">
          <section className="differenceLegendGroup night">
            <h3>夜が多い</h3>
            <div><span className="box differenceNightStrong" />75%以上</div>
            <div><span className="box differenceNightHigh" />50%〜75%未満</div>
            <div><span className="box differenceNight" />25%〜50%未満</div>
            <div><span className="box differenceNightLow" />0%〜25%未満</div>
          </section>
          <section className="differenceLegendGroup day">
            <h3>昼が多い</h3>
            <div><span className="box differenceDayLow" />0%〜25%未満</div>
            <div><span className="box differenceDay" />25%〜50%未満</div>
            <div><span className="box differenceDayHigh" />50%〜75%未満</div>
            <div><span className="box differenceDayStrong" />75%以上</div>
          </section>
          <small className="differenceLegendNote">最大需要差に対する割合（需要差＝夜−昼）</small>
        </div>
      ) : (
        ranges.map((label, index) => (
          <div key={label}>
            <span className={`box c${index + 1} ${timezone === "1" ? "dayScale" : timezone === "2" ? "nightScale" : ""}`}></span>
            {label}
          </div>
        ))
      )}

      <section
        className={`facilityLegend ${
          showCommercialFacilities ? "visible" : "hidden"
        }`}
        aria-label="商業施設の規模"
        aria-hidden={!showCommercialFacilities}
      >
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
    </div>
  );
}

export default Legend;
