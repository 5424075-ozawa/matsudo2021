import { months } from "../utils/labels";
import { serviceAreas } from "../utils/serviceAreas";

function ControlPanel({
  month,
  dayflag,
  timezone,
  selectedArea,
  showMesh,
  showStations,
  onMonthChange,
  onDayflagChange,
  onTimezoneChange,
  onAreaChange,
  onShowMeshChange,
  onShowStationsChange,
}) {
  return (
    <section className="controls">
      <label>
        対象営業区域：
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

      <label className="checkboxLabel">
        <input
          type="checkbox"
          checked={showMesh}
          onChange={onShowMeshChange}
        />
        メッシュ表示
      </label>

      <label className="checkboxLabel">
        <input
          type="checkbox"
          checked={showStations}
          onChange={onShowStationsChange}
        />
        駅表示
      </label>
    </section>
  );
}

export default ControlPanel;