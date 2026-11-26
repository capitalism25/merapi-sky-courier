// Merapi Sky Courier — game loop and state machine.
// One clear job: own the states (menu, flying, paused, crashed,
// landed), wire input, physics, world and rendering together, and
// keep the frame loop honest about time.
import { VIEW_W, VIEW_H, MISSIONS } from './config.js';
import { createInput } from './input.js';
import { buildWorld } from './world.js';
import { createPlane, updatePlane } from './physics.js';
import { render } from './render.js';
import { createAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = createInput(canvas);
const audio = createAudio();

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const game = {
  missionIndex: 0,
  mission: MISSIONS[0],
  world: buildWorld(MISSIONS[0]),
  plane: createPlane(MISSIONS[0]),
  state: 'menu',
  time: 0,
  lastRingCount: 0,
  warnedLowFuel: false,
};

function startMission(index) {
  game.missionIndex = index;
  game.mission = MISSIONS[index];
  game.world = buildWorld(game.mission);
  game.plane = createPlane(game.mission);
  game.state = 'flying';
  game.lastRingCount = 0;
  game.warnedLowFuel = false;
  audio.unlock();
  statusEl.textContent = `${game.mission.name}: flying. Thread the rings and land on runway 09.`;
}

function restart() {
  startMission(game.missionIndex);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  game.time += dt;

  // One-shot keys, checked every frame in every state.
  if (input.consume('KeyP') && (game.state === 'flying' || game.state === 'paused')) {
    game.state = game.state === 'flying' ? 'paused' : 'flying';
  }
  if (input.consume('KeyR') && game.state !== 'menu') restart();
  if (input.consume('MouseClick')) audio.unlock();
  for (let i = 0; i < MISSIONS.length; i++) {
    if (input.consume(`Digit${i + 1}`)) startMission(i);
  }

  if (game.state === 'flying') {
    updatePlane(game.plane, input.state, game.mission, game.world, dt);
    audio.setEngine(game.plane.throttle, true);
    if (game.plane.ringsHit > game.lastRingCount) {
      game.lastRingCount = game.plane.ringsHit;
      audio.ring();
      statusEl.textContent = `Ring ${game.plane.ringsHit} of ${game.mission.rings}. Score ${game.plane.score}.`;
    }
    if (game.plane.fuel < 25 && !game.warnedLowFuel) {
      game.warnedLowFuel = true;
      audio.warning();
    }
    if (game.plane.crashed) {
      game.state = 'crashed';
      audio.crash();
      audio.setEngine(0, false);
      statusEl.textContent = `Crashed: ${game.plane.crashReason} Score ${game.plane.score}. Press R to fly again.`;
    } else if (game.plane.landed) {
      game.state = 'landed';
      audio.landed();
      audio.setEngine(0, false);
      statusEl.textContent = `Landed on runway 09. Score ${game.plane.score}. Press R to fly again.`;
    } else if (game.plane.ringsHit >= game.mission.rings && game.plane.distance >= game.mission.distance) {
      game.state = 'complete';
      audio.landed();
      statusEl.textContent = `Mission complete. Score ${game.plane.score}. Press R to fly again.`;
    }
  } else {
    audio.setEngine(0, false);
  }

  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
