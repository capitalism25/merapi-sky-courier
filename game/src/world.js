// Merapi Sky Courier — the world the plane flies over.
// One clear job: deterministic terrain, rings and the runway, built
// from distance alone so the same flight always shows the same ridge.
// The ridge is recognisable on purpose: a Merapi-style cone volcano,
// rice terraces, a river, a small town, then runway 09 at the end.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildWorld(mission) {
  const rand = mulberry32(20261126 + mission.rings * 97 + mission.distance);
  const rings = [];
  const spacing = mission.distance / (mission.rings + 1);
  for (let i = 0; i < mission.rings; i++) {
    rings.push({
      index: i,
      distance: spacing * (i + 1),
      lateral: (rand() * 2 - 1) * 0.62,
      altitude: 180 + rand() * 420,
      radius: 46,
      passed: false,
    });
  }
  // Terrain features keyed by distance: cone, terraces, river, town.
  const features = [
    { at: 900, kind: 'cone', label: 'MT MERAPI' },
    { at: 2100, kind: 'terraces', label: 'RICE TERRACES' },
    { at: 3400, kind: 'river', label: 'PROGO RIVER' },
    { at: 4700, kind: 'town', label: 'MAGELANG' },
    { at: mission.distance - 900, kind: 'cone', label: 'MT SINDORO' },
  ];
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    clouds.push({
      x: rand(),
      y: 0.06 + rand() * 0.24,
      scale: 0.5 + rand() * 1.1,
      speed: 0.004 + rand() * 0.01,
    });
  }
  const fields = [];
  for (let i = 0; i < 48; i++) {
    fields.push({
      offset: rand(),
      width: 0.08 + rand() * 0.22,
      tone: i % 3,
      row: i % 4,
    });
  }
  return {
    mission,
    rings,
    features,
    clouds,
    fields,
    runwayAt: mission.distance,
    runwayLength: 700,
  };
}

// Project a world point (distance ahead, lateral -1..1, altitude m)
// into screen space. Near = big and low, far = small near the horizon.
export function project(distanceAhead, lateral, altitude, viewW, horizonY) {
  const t = Math.max(0.02, Math.min(1, 1 - distanceAhead / 5200));
  const scale = 0.06 + t * t * 1.35;
  const x = viewW / 2 + lateral * viewW * 0.42 * (0.25 + t);
  const y = horizonY - (altitude / 620) * 260 * t - (1 - t) * 40;
  return { x, y, scale, t };
}

export function nextRing(world) {
  return world.rings.find((r) => !r.passed && !r.missed) || null;
}

export function nearestFeature(world, distance) {
  let best = null;
  let bestD = Infinity;
  for (const f of world.features) {
    const d = Math.abs(f.at - distance);
    if (d < bestD) {
      bestD = d;
      best = f;
    }
  }
  return best && bestD < 900 ? { feature: best, ahead: best.at - distance } : null;
}
