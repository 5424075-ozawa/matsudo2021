import { months } from "../utils/labels";

function ControlPanel({
  month,
  dayflag,
  timezone,
  selectedCity,
  onMonthChange,
  onDayflagChange,
  onTimezoneChange,
  onCityChange,
}) {
  return (
    <section className="controls">
      <label>
        対象地域：
        <select value={selectedCity} onChange={onCityChange}>
          <option value="12207">松戸市</option>
          <option value="12217">柏市</option>
          <option value="12220">流山市</option>
          <option value="12221">八千代市</option>
          <option value="12227">浦安市</option>
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
    </section>
  );
}

export default ControlPanel;