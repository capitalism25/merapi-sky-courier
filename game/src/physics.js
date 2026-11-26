// Merapi Sky Courier — flight model.
// One clear job: how throttle, bank, climb, wind, fuel and damage
// move the plane. No drawing here, so the numbers stay honest.
import { TUNING } from './config.js';

export function createPlane(mission) {
  return {
    lateral: 0, // -1 left .. 1 right across the corridor
    altitude: 240, // metres above the valley floor
    speed: 95, // knots
    heading: 90, // degrees, 090 = east along the valley
    throttle: 62, // percent
    bank: 0, // degrees, positive = right
    fuel: mission.fuel,
    hull: 100,
    distance: 0,
    score: 0,
    ringsHit: 0,
    time: 0,
    landed: false,
    crashed: false,
    crashReason: '',
    windGust: 0,
  };
}

export function updatePlane(plane, input, mission, world, dt) {
  if (plane.crashed || plane.landed) return;
  plane.time += dt;

  // Throttle: smooth, disciplined throttle is rewarded — full power
  // burns fuel fast and makes the rings harder to thread.
  if (input.throttleUp) plane.throttle = Math.min(100, plane.throttle + 34 * dt);
  if (input.throttleDown) plane.throttle = Math.max(0, plane.throttle - 42 * dt);

  const targetSpeed = TUNING.minSpeed + (plane.throttle / 100) * (TUNING.maxSpeed - TUNING.minSpeed);
  plane.speed += (targetSpeed - plane.speed) * Math.min(1, 0.9 * dt);

  // Bank and heading. Mouse steers gently too, keyboard steers hard.
  let bankTarget = 0;
  if (input.bankLeft) bankTarget = -TUNING.bankMax;
  if (input.bankRight) bankTarget = TUNING.bankMax;
  if (!input.bankLeft && !input.bankRight && input.mouseActive) {
    bankTarget = (input.mouseX - 0.5) * 2 * TUNING.bankMax * 0.55;
  }
  plane.bank += (bankTarget - plane.bank) * Math.min(1, 4.5 * dt);
  plane.heading += (plane.bank / TUNING.bankMax) * TUNING.turnRate * dt;
  plane.heading = ((plane.heading % 360) + 360) % 360;
  plane.lateral += (plane.bank / TUNING.bankMax) * 0.34 * dt;
  plane.lateral = Math.max(-1.15, Math.min(1.15, plane.lateral));

  // Wind gusts push the nose sideways on the long hop.
  plane.windGust = Math.sin(plane.time * 0.7) * mission.wind * 0.22;
  plane.lateral += plane.windGust * dt * 0.4;

  // Climb costs speed, descent buys it back.
  if (input.climb && plane.fuel > 0) {
    plane.altitude += TUNING.climbRate * dt;
    plane.speed = Math.max(TUNING.minSpeed, plane.speed - 26 * dt);
  } else if (input.descend) {
    plane.altitude -= TUNING.sinkRate * dt;
    plane.speed = Math.min(TUNING.maxSpeed, plane.speed + 12 * dt);
  } else {
    // Level flight settles gently toward 240 m.
    plane.altitude += (240 - plane.altitude) * 0.12 * dt;
  }
  if (plane.fuel <= 0) {
    plane.altitude -= TUNING.sinkRate * 1.4 * dt;
    plane.speed = Math.max(40, plane.speed - 10 * dt);
  }
  plane.altitude = Math.min(980, plane.altitude);

  // Fuel: burn scales with throttle squared — cruise, don't firewall it.
  const burn = TUNING.fuelBurn * Math.pow(plane.throttle / 100, 2) * 2.2;
  plane.fuel = Math.max(0, plane.fuel - burn * dt);

  plane.distance += (plane.speed * 0.514) * dt; // knots to m/s
  plane.score = Math.max(plane.score, Math.floor(plane.distance / 50) + plane.ringsHit * TUNING.ringScore);

  // Rings: pass within the ring's tube in lateral and altitude.
  // A ring flown past without threading is missed, not stuck: the
  // HUD then moves on to the next ring instead of showing 0 m forever.
  for (const ring of world.rings) {
    if (ring.passed || ring.missed) continue;
    if (plane.distance > ring.distance + 18) {
      ring.missed = true;
      continue;
    }
    if (plane.distance >= ring.distance - 18 && plane.distance <= ring.distance + 18) {
      const lateralGap = Math.abs(plane.lateral - ring.lateral);
      const altGap = Math.abs(plane.altitude - ring.altitude);
      if (lateralGap < 0.34 && altGap < 110) {
        ring.passed = true;
        plane.ringsHit += 1;
        plane.fuel = Math.min(100, plane.fuel + TUNING.ringFuel);
        plane.score += TUNING.ringScore;
      }
    }
  }

  // Ground and ridge: the valley floor is at 0 m. The cone is scenery
  // on the ridge wall, so it only raises the safe floor to 120 m near
  // it — cruising at the usual 240 m over the valley is always safe,
  // and only a low dive near the cone scrapes the ridge.
  const nearCone = world.features.some(
    (f) => f.kind === 'cone' && Math.abs(f.at - plane.distance) < 260,
  );
  const groundClearance = nearCone ? 120 : 0;
  if (plane.altitude <= groundClearance + 4) {
    const onRunway = plane.distance >= world.runwayAt - 60 && plane.distance <= world.runwayAt + world.runwayLength;
    const gentle = plane.speed < 118 && Math.abs(plane.bank) < 14 && Math.abs(plane.lateral) < 0.22;
    if (onRunway && gentle && plane.distance >= world.runwayAt) {
      plane.landed = true;
      plane.altitude = 0;
      plane.score += TUNING.landingBonus;
    } else if (onRunway && plane.distance >= world.runwayAt && !gentle) {
      plane.crashed = true;
      plane.crashReason = 'Hard landing on runway 09 — too fast or banked.';
    } else {
      plane.hull -= (nearCone ? TUNING.mountainDamage : TUNING.groundDamage) * dt * 4;
      plane.altitude = groundClearance + 4;
      if (plane.hull <= 0) {
        plane.hull = 0;
        plane.crashed = true;
        plane.crashReason = nearCone ? 'Flew into the Merapi ridge.' : 'Hit the valley floor.';
      }
    }
  }
  // Out of the corridor: the ridge walls push back with damage.
  if (Math.abs(plane.lateral) >= 1.12) {
    plane.hull -= 12 * dt;
    plane.lateral = Math.max(-1.12, Math.min(1.12, plane.lateral));
    if (plane.hull <= 0) {
      plane.hull = 0;
      plane.crashed = true;
      plane.crashReason = 'Clipped the ridge wall outside the corridor.';
    }
  }
}
