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
}) {
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
        <span>メッシュ数</span>
        <strong>{meshCount}件</strong>
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
  );
}

export default SummaryCards;