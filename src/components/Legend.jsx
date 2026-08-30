function Legend({ maxPopulation }) {
  if (maxPopulation === 0) {
    return (
      <div className="legend">
        <h2>凡例</h2>
        <div>表示できる人口データがありません</div>
      </div>
    );
  }

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

      {ranges.map((label, index) => (
        <div key={label}>
          <span className={`box c${index + 1}`}></span>
          {label}
        </div>
      ))}
    </div>
  );
}

export default Legend;
