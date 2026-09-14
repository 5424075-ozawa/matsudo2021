export function getColor(value, max) {
  if (max === 0) {
    return "#eeeeee";
  }

  const ratio = value / max;

  if (ratio < 0.1) return "#feb24c";
  if (ratio < 0.2) return "#fd8d3c";
  if (ratio < 0.4) return "#fc4e2a";
  if (ratio < 0.6) return "#e31a1c";
  if (ratio < 0.8) return "#bd0026";

  return "#800026";
}

export function getTimeOfDayColor(value, max, timezone) {
  if (timezone === "0") return getColor(value, max);
  if (max === 0) return "#eeeeee";

  const ratio = value / max;
  const daytime = ["#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#dc2626", "#991b1b"];
  const nighttime = ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#2563eb", "#1e3a8a"];
  const colors = timezone === "1" ? daytime : nighttime;
  const index = ratio < 0.1 ? 0 : ratio < 0.2 ? 1 : ratio < 0.4 ? 2 : ratio < 0.6 ? 3 : ratio < 0.8 ? 4 : 5;

  return colors[index];
}

export function getDifferenceColor(value, maxAbsoluteDifference) {
  if (maxAbsoluteDifference === 0 || value === 0) return "#f1f5f9";

  const ratio = Math.abs(value) / maxAbsoluteDifference;

  if (value > 0) {
    if (ratio < 0.25) return "#bfdbfe";
    if (ratio < 0.5) return "#60a5fa";
    if (ratio < 0.75) return "#2563eb";
    return "#1e3a8a";
  }

  if (ratio < 0.25) return "#fecaca";
  if (ratio < 0.5) return "#f87171";
  if (ratio < 0.75) return "#dc2626";
  return "#991b1b";
}
