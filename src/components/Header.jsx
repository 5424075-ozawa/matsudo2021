function Header({ minimized, onToggleMinimize, onOpenTutorial }) {
  return (
    <header className="header">
      <div className="headerText">
        <h1>
          <span className="headerTitleLine">タクシー営業区域別</span>{" "}
          <span className="headerTitleLine">人流可視化マップ</span>
        </h1>

        <p>
          2021年の1kmエリア別滞在人口データを用いて、
          営業区域別に人流を可視化します。
        </p>
      </div>

      <div className="headerActions">
        <button
          type="button"
          className="tutorialOpenButton"
          onClick={onOpenTutorial}
          aria-label="使い方を見る"
          title="使い方を見る"
        >
          ?
        </button>
        <button
          type="button"
          className="drawerToggleButton headerMinimizeButton"
          onClick={onToggleMinimize}
          aria-expanded={!minimized}
          aria-label={minimized ? "ヘッダーを展開" : "ヘッダーを小さくする"}
          title={minimized ? "ヘッダーを展開" : "ヘッダーを小さくする"}
        >
          <span
            className={`drawerToggleIcon ${minimized ? "down" : "up"}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}

export default Header;
