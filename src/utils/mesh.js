export function mesh1kmToBounds(meshId) {
  const code = String(meshId);

  const p = Number(code.slice(0, 2));
  const q = Number(code.slice(2, 4));
  const r = Number(code.slice(4, 5));
  const s = Number(code.slice(5, 6));
  const t = Number(code.slice(6, 7));
  const u = Number(code.slice(7, 8));

  const south = p / 1.5 + r * (5 / 60) + t * (30 / 3600);
  const west = q + 100 + s * (7.5 / 60) + u * (45 / 3600);

  const north = south + 30 / 3600;
  const east = west + 45 / 3600;

  return [
    [south, west],
    [north, east],
  ];
}

export function mesh1kmToCenter(meshId) {
  const bounds = mesh1kmToBounds(meshId);

  const south = bounds[0][0];
  const west = bounds[0][1];
  const north = bounds[1][0];
  const east = bounds[1][1];

  return {
    lat: (south + north) / 2,
    lng: (west + east) / 2,
  };
}