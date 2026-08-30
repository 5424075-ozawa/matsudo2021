import { months } from "../utils/labels";
import { serviceAreas } from "../utils/serviceAreas";

function ControlPanel({
  month,
  dayflag,
  timezone,
  selectedArea,
  showStations,
  showCommercialFacilities,
  onMonthChange,
  onDayflagChange,
  onTimezoneChange,
  onAreaChange,
  onShowStationsChange,
  onShowCommercialFacilitiesChange,
}) {
  return (
    <section className="controls">
      <div className="conditionControls">
        <label>
          交通圏：
          <select value={selectedArea} onChange={onAreaChange}>
            {Object.entries(serviceAreas).map(([key, area]) => (
              <option key={key} value={key}>
                {area.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          月：
          <select value={month} onChange={onMonthChange}>
            {months.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          曜日区分：
          <select value={dayflag} onChange={onDayflagChange}>
            <option value="0">全日</option>
            <option value="1">平日</option>
            <option value="2">休日</option>
          </select>
        </label>

        <label>
          時間帯：
          <select value={timezone} onChange={onTimezoneChange}>
            <option value="0">終日</option>
            <option value="1">昼</option>
            <option value="2">夜</option>
          </select>
        </label>

        <div className="displayToggleGroup" aria-label="地図表示切り替え">
        <button
          type="button"
          className={`displayToggleButton ${showStations ? "active" : ""}`}
          aria-pressed={showStations}
          onClick={onShowStationsChange}
        >
          駅
        </button>

        <button
          type="button"
          className={`displayToggleButton ${
            showCommercialFacilities ? "active" : ""
          }`}
          aria-pressed={showCommercialFacilities}
          onClick={onShowCommercialFacilitiesChange}
        >
          商業施設
        </button>

        </div>
      </div>
    </section>
  );
}

export default ControlPanel;
