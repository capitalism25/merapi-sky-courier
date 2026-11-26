// Merapi Sky Courier — tuning, missions and shared constants.
// One clear job: every number the game balances on lives here, so a
// balance change never touches physics, world or rendering code.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HORIZON_Y = 296;

export const MISSIONS = [
  {
    id: 'ring-run',
    key: '1',
    name: 'RING RUN',
    subtitle: 'Merapi Ridge · 8 rings',
    distance: 6000,
    rings: 8,
    wind: 0.12,
    fuel: 100,
    blurb: 'Thread every glowing ring over the ridge. Rings top the fuel up.',
  },
  {
    id: 'island-hop',
    key: '2',
    name: 'ISLAND HOP',
    subtitle: 'Coast to coast · 12 rings',
    distance: 9500,
    rings: 12,
    wind: 0.35,
    fuel: 100,
    blurb: 'Longer hop, stronger gusts. Smooth throttle wins, not full power.',
  },
  {
    id: 'dawn-landing',
    key: '3',
    name: 'DAWN LANDING',
    subtitle: 'Night ridge · land on runway 09',
    distance: 8000,
    rings: 6,
    wind: 0.2,
    fuel: 100,
    night: true,
    blurb: 'Follow the rings home, then put her down gently on runway 09.',
  },
];

export const TUNING = {
  maxSpeed: 210, // knots at full throttle
  minSpeed: 55, // below this the wing stops flying
  climbRate: 92, // metres per second at full climb
  sinkRate: 68,
  turnRate: 26, // degrees per second at full bank
  bankMax: 38,
  fuelBurn: 0.55, // per second at full throttle, scaled by throttle
  ringFuel: 6,
  ringScore: 100,
  landingBonus: 500,
  groundDamage: 34,
  mountainDamage: 60,
};

export const COLOURS = {
  skyTop: '#2b6cb0',
  skyMid: '#7fb3e0',
  skyHorizon: '#ffd9a0',
  nightTop: '#0a1230',
  nightMid: '#1b2a55',
  nightHorizon: '#e07840',
  groundNear: '#3f7a34',
  groundFar: '#6da055',
  fieldA: '#4c8a3d',
  fieldB: '#7a9a3f',
  fieldC: '#c2a55a',
  runway: '#2e3138',
  runwayMark: '#f5f2e6',
  ring: '#ffb020',
  ringGlow: '#ffdf6b',
  hud: '#e8f6ff',
  hudAmber: '#ffb020',
  hudRed: '#ff5a4e',
  panel: '#141a26',
  panelEdge: '#2c3a55',
  gaugeFace: '#0e1a2e',
};
