import { months } from "../utils/labels";

function ControlPanel({
  month,
  dayflag,
  timezone,
  onMonthChange,
  onDayflagChange,
  onTimezoneChange,
}) {
  return (
    <section className="controls">
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