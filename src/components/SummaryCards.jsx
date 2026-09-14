import {
  dayflagLabels,
  timezoneLabels,
} from "../utils/labels";

function SummaryCards({
  month,
  dayflag,
  timezone,
  meshCount,
  totalPopulation,
  maxPopulation,
  averagePopulation,
  isDifferenceMode,
  nighttimeIncreaseCount,
  daytimeIncreaseCount,
  maxNighttimeIncrease,
  maxDaytimeIncrease,
}) {
  if (isDifferenceMode) {
    return (
      <section className="summary">
        <div className="card"><span>条件</span><strong>2021年{Number(month)}月 / {dayflagLabels[dayflag]} / 昼夜差</strong></div>
        <div className="card"><span>対象エリア</span><strong>{meshCount}件</strong></div>
        <div className="card"><span>夜に増えるエリア</span><strong>{nighttimeIncreaseCount}件</strong></div>
        <div className="card"><span>夜の最大増加</span><strong>+{maxNighttimeIncrease.toLocaleString()}人</strong></div>
        <div className="card"><span>昼の最大増加</span><strong>+{maxDaytimeIncrease.toLocaleString()}人</strong></div>
      </section>
    );
  }

  return (
    <section className="summary">
      <div className="card">
        <span>条件</span>

        <strong>
          2021年{Number(month)}月 / {dayflagLabels[dayflag]} /{" "}
          {timezoneLabels[timezone]}
        </strong>
      </div>

      <div className="card">
        <span>エリア数</span>
        <strong>{meshCount}件</strong>
      </div>

      <div className="card">
        <span>滞在人口合計</span>
        <strong>{totalPopulation.toLocaleString()}人</strong>
      </div>

      <div className="card">
        <span>最大エリア人口</span>
        <strong>{maxPopulation.toLocaleString()}人</strong>
      </div>

      <div className="card">
        <span>平均エリア人口</span>
        <strong>{averagePopulation.toLocaleString()}人</strong>
      </div>
    </section>
  );
}

export default SummaryCards;
