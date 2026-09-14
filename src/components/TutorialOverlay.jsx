const tutorialSteps = [
  {
    title: "地図の色を見る",
    description: "色が濃いほど、滞在人口や昼夜の需要差が大きいエリアです。凡例で色の意味を確認できます。",
  },
  {
    title: "エリアを選ぶ",
    description: "地図上の四角いエリアを押すと、その場所の人口と条件を確認できます。",
  },
  {
    title: "複数エリアを比較する",
    description: "続けて別のエリアを押すと、最大5地点の月別推移を比較できます。",
  },
];

function TutorialOverlay({ step, onNext, onBack, onClose }) {
  const current = tutorialSteps[step];
  const isLastStep = step === tutorialSteps.length - 1;

  return (
    <div className="tutorialBackdrop" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle">
      <section className="tutorialCard">
        <button type="button" className="tutorialSkip" onClick={onClose}>
          スキップ
        </button>

        <div className="tutorialStepBadge">{step + 1}</div>
        <p className="tutorialProgress">{step + 1} / {tutorialSteps.length}</p>
        <h2 id="tutorialTitle">{current.title}</h2>
        <p className="tutorialDescription">{current.description}</p>

        <div className="tutorialDots" aria-hidden="true">
          {tutorialSteps.map((item, index) => (
            <span key={item.title} className={index === step ? "active" : ""} />
          ))}
        </div>

        <div className="tutorialActions">
          {step > 0 && <button type="button" className="secondary" onClick={onBack}>戻る</button>}
          <button type="button" className="primary" onClick={isLastStep ? onClose : onNext}>
            {isLastStep ? "地図を見る" : "次へ"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default TutorialOverlay;
