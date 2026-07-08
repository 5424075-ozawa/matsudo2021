export function getColor(value, max) {
  if (max === 0) {
    return "#eeeeee";
  }

  const ratio = value / max;

  if (ratio > 0.8) return "#800026";
  if (ratio > 0.6) return "#bd0026";
  if (ratio > 0.4) return "#e31a1c";
  if (ratio > 0.2) return "#fc4e2a";
  if (ratio > 0.1) return "#fd8d3c";

  return "#feb24c";
}