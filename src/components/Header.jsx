function Header({ minimized, onToggleMinimize }) {
  return (
    <header className="header">
      <div className="headerText">
        <h1>
          <span className="headerTitleLine">タクシー営業区域別</span>{" "}
          <span className="headerTitleLine">人流可視化マップ</span>
        </h1>

        <p>
          2021年の1kmメッシュ別滞在人口データを用いて、
          営業区域別に人流を可視化します。
        </p>
      </div>

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
    </header>
  );
}

export default Header;
