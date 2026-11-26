// Merapi Sky Courier — all drawing.
// One clear job: sky, terrain, runway, rings, the aircraft, the lit
// instruments and the HUD. No game logic here, only what the pilot sees.
import { VIEW_W, VIEW_H, HORIZON_Y, COLOURS, MISSIONS } from './config.js';
import { project, nearestFeature } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, mission, time) {
  const night = mission.night;
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 40);
  g.addColorStop(0, night ? COLOURS.nightTop : COLOURS.skyTop);
  g.addColorStop(0.55, night ? COLOURS.nightMid : COLOURS.skyMid);
  g.addColorStop(1, night ? COLOURS.nightHorizon : COLOURS.skyHorizon);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, HORIZON_Y + 40);
  // Sun / moon and light haze.
  ctx.save();
  ctx.globalAlpha = night ? 0.95 : 0.9;
  ctx.fillStyle = night ? '#f5f0d8' : '#fff3c4';
  ctx.beginPath();
  ctx.arc(VIEW_W * 0.78, night ? 84 : 96, night ? 26 : 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(VIEW_W * 0.78, night ? 84 : 96, night ? 44 : 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  void time;
}

function drawClouds(ctx, world, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const c of world.clouds) {
    const x = (((c.x + time * c.speed) % 1.2) - 0.1) * VIEW_W;
    const y = c.y * VIEW_H;
    const s = c.scale;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(x, y, 52 * s, 15 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 34 * s, y + 5 * s, 38 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 36 * s, y + 6 * s, 32 * s, 11 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMountains(ctx, plane, world) {
  // Far ridge: a Merapi-style cone left, Sindoro right, hazy blue.
  ctx.save();
  ctx.fillStyle = '#5b7fa6';
  ctx.beginPath();
  ctx.moveTo(0, HORIZON_Y);
  ctx.lineTo(180, HORIZON_Y - 118);
  ctx.lineTo(300, HORIZON_Y - 62);
  ctx.lineTo(430, HORIZON_Y);
  ctx.closePath();
  ctx.fill();
  // The cone itself, with a lit crater rim.
  ctx.fillStyle = '#4a6b8f';
  ctx.beginPath();
  ctx.moveTo(120, HORIZON_Y);
  ctx.lineTo(255, HORIZON_Y - 168);
  ctx.lineTo(390, HORIZON_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8f2ff';
  ctx.beginPath();
  ctx.moveTo(232, HORIZON_Y - 138);
  ctx.lineTo(255, HORIZON_Y - 168);
  ctx.lineTo(282, HORIZON_Y - 136);
  ctx.lineTo(268, HORIZON_Y - 124);
  ctx.lineTo(244, HORIZON_Y - 126);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#54769c';
  ctx.beginPath();
  ctx.moveTo(880, HORIZON_Y);
  ctx.lineTo(1030, HORIZON_Y - 132);
  ctx.lineTo(1180, HORIZON_Y);
  ctx.closePath();
  ctx.fill();
  const near = nearestFeature(world, plane.distance);
  if (near) {
    // Landmark name sits in the HUD's subtitle line, not over the sky,
    // so it never collides with the compass strip or a ring.
    ctx.fillStyle = '#e8f6ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${near.feature.label} · ${Math.max(0, Math.round(near.ahead))} m AHEAD`, 32, HORIZON_Y - 8);
  }
  ctx.restore();
}

function drawGround(ctx, plane, world) {
  // Perspective ground: converging field strips scroll with distance.
  const g = ctx.createLinearGradient(0, HORIZON_Y, 0, VIEW_H);
  g.addColorStop(0, COLOURS.groundFar);
  g.addColorStop(1, COLOURS.groundNear);
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON_Y, VIEW_W, VIEW_H - HORIZON_Y);
  const scroll = (plane.distance / 60) % 1;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(VIEW_W / 2 + i * 46, HORIZON_Y);
    ctx.lineTo(VIEW_W / 2 + i * 190, VIEW_H);
    ctx.stroke();
  }
  const tones = [COLOURS.fieldA, COLOURS.fieldB, COLOURS.fieldC];
  world.fields.forEach((f, i) => {
    const row = (f.row + Math.floor(plane.distance / 240) + i) % 4;
    const y = HORIZON_Y + 34 + row * 92 + scroll * 30;
    if (y > VIEW_H) return;
    ctx.fillStyle = tones[f.tone];
    ctx.globalAlpha = 0.85;
    const w = VIEW_W * f.width * (0.5 + row * 0.22);
    ctx.fillRect(f.offset * VIEW_W - w / 2, y, w, 52);
  });
  ctx.restore();
  // River: a blue band crossing the ground.
  const riverAhead = 3400 - plane.distance;
  if (riverAhead > -400 && riverAhead < 2400) {
    const t = Math.max(0, 1 - riverAhead / 2400);
    ctx.save();
    ctx.fillStyle = '#3f8fd0';
    ctx.globalAlpha = 0.85;
    const y = HORIZON_Y + 30 + t * (VIEW_H - HORIZON_Y - 60);
    ctx.fillRect(0, y, VIEW_W, 16 + t * 22);
    ctx.restore();
  }
}

function drawRunway(ctx, plane, world) {
  const ahead = world.runwayAt - plane.distance;
  // Only draw the strip once it is close enough to read as a runway;
  // from far away it looked like a dark pyramid on the horizon.
  if (ahead < -world.runwayLength || ahead > 2500) return;
  const p = project(Math.max(0, ahead), 0, 0, VIEW_W, HORIZON_Y);
  const w = 26 + p.scale * 150;
  const h = 40 + p.scale * 260;
  ctx.save();
  ctx.fillStyle = COLOURS.runway;
  ctx.beginPath();
  ctx.moveTo(p.x - w * 0.32, p.y);
  ctx.lineTo(p.x + w * 0.32, p.y);
  ctx.lineTo(p.x + w, p.y + h);
  ctx.lineTo(p.x - w, p.y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLOURS.runwayMark;
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + 8);
  ctx.lineTo(p.x, p.y + h - 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffb020';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('09', p.x, p.y + h * 0.55);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#e8f6ff';
  ctx.fillText(ahead > 0 ? `RUNWAY 09 · ${Math.round(ahead)} m` : 'RUNWAY 09 · LAND NOW', VIEW_W / 2, HORIZON_Y + 26);
  ctx.restore();
}

function drawRings(ctx, plane, world) {
  for (const ring of world.rings) {
    if (ring.missed) continue;
    const ahead = ring.distance - plane.distance;
    if (ahead < -40 || ahead > 5200) continue;
    const p = project(ahead, ring.lateral, ring.altitude, VIEW_W, HORIZON_Y);
    const r = Math.max(8, ring.radius * p.scale * 0.9);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(plane.bank * -0.004);
    ctx.strokeStyle = ring.passed ? '#57e389' : COLOURS.ring;
    ctx.lineWidth = Math.max(3, r * 0.16);
    ctx.shadowColor = ring.passed ? '#57e389' : COLOURS.ringGlow;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(11, r * 0.42)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(ring.index + 1), 0, 1);
    ctx.restore();
  }
}

function drawPlane(ctx, plane) {
  // Chase view: the courier plane, banked, cockpit glass lit, in frame.
  const cx = VIEW_W / 2 + plane.lateral * 130;
  const cy = VIEW_H - 168;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((plane.bank * Math.PI) / 180 * 0.55);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  // Wings.
  ctx.fillStyle = '#d8433a';
  ctx.beginPath();
  ctx.moveTo(-14, 6);
  ctx.lineTo(-168, 34);
  ctx.lineTo(-168, 48);
  ctx.lineTo(-10, 26);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(14, 6);
  ctx.lineTo(168, 34);
  ctx.lineTo(168, 48);
  ctx.lineTo(10, 26);
  ctx.closePath();
  ctx.fill();
  // Tail.
  ctx.fillStyle = '#b8322a';
  ctx.beginPath();
  ctx.moveTo(-8, -52);
  ctx.lineTo(-34, -84);
  ctx.lineTo(-18, -84);
  ctx.lineTo(2, -54);
  ctx.closePath();
  ctx.fill();
  // Fuselage.
  const body = ctx.createLinearGradient(0, -88, 0, 34);
  body.addColorStop(0, '#f7f3ea');
  body.addColorStop(0.6, '#e8e2d2');
  body.addColorStop(1, '#c9bfa4');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0, -96);
  ctx.quadraticCurveTo(20, -70, 22, -18);
  ctx.quadraticCurveTo(22, 22, 0, 34);
  ctx.quadraticCurveTo(-22, 22, -22, -18);
  ctx.quadraticCurveTo(-20, -70, 0, -96);
  ctx.fill();
  // Lit cockpit glass.
  ctx.fillStyle = '#7fe3ff';
  ctx.shadowColor = '#7fe3ff';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.ellipse(0, -58, 11, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#123';
  ctx.beginPath();
  ctx.ellipse(0, -58, 11, 18, 0, 0, Math.PI * 2);
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#bff3ff';
  ctx.beginPath();
  ctx.ellipse(-3, -64, 5, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Stripe and nav lights.
  ctx.fillStyle = '#d8433a';
  ctx.fillRect(-22, -8, 44, 7);
  ctx.fillStyle = '#57e389';
  ctx.beginPath();
  ctx.arc(168, 40, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5a4e';
  ctx.beginPath();
  ctx.arc(-168, 40, 5, 0, Math.PI * 2);
  ctx.fill();
  // Propeller blur / exhaust.
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 38, 10, 16 + plane.throttle * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function gauge(ctx, x, y, r, label, value, max, unit) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COLOURS.gaugeFace;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLOURS.panelEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#3a5a80';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const a = (-210 + i * 30) * (Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8));
    ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
    ctx.stroke();
  }
  const frac = Math.max(0, Math.min(1, value / max));
  const ang = (-210 + frac * 240) * (Math.PI / 180);
  ctx.strokeStyle = '#ffb020';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(ang) * (r - 12), Math.sin(ang) * (r - 12));
  ctx.stroke();
  ctx.fillStyle = '#e8f6ff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.round(value)), 0, 6);
  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#9db8d6';
  ctx.fillText(label, 0, r - 8);
  ctx.fillText(unit, 0, -r + 14);
  ctx.restore();
}

function drawPanel(ctx, plane, mission) {
  // Cockpit panel: lit instruments across the bottom.
  ctx.save();
  ctx.fillStyle = COLOURS.panel;
  roundRect(ctx, 0, VIEW_H - 108, VIEW_W, 108, 0);
  ctx.fill();
  ctx.strokeStyle = COLOURS.panelEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H - 108);
  ctx.lineTo(VIEW_W, VIEW_H - 108);
  ctx.stroke();
  // Artificial horizon.
  const hx = 150;
  const hy = VIEW_H - 54;
  ctx.save();
  ctx.beginPath();
  ctx.arc(hx, hy, 34, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#3f8fd0';
  ctx.fillRect(hx - 34, hy - 34, 68, 34 - plane.bank * 0.12);
  ctx.fillStyle = '#7a5a34';
  ctx.fillRect(hx - 34, hy - plane.bank * 0.12, 68, 34 + plane.bank * 0.12);
  ctx.restore();
  ctx.strokeStyle = '#e8f6ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hx, hy, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx - 34, hy);
  ctx.lineTo(hx + 34, hy);
  ctx.stroke();
  ctx.fillStyle = '#9db8d6';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ATTITUDE', hx, hy + 48);
  gauge(ctx, 300, VIEW_H - 54, 36, 'ALT', plane.altitude, 1000, 'm');
  gauge(ctx, 410, VIEW_H - 54, 36, 'SPD', plane.speed, 220, 'kt');
  gauge(ctx, 520, VIEW_H - 54, 36, 'HDG', plane.heading, 360, 'deg');
  // Throttle lever.
  ctx.fillStyle = '#0e1a2e';
  roundRect(ctx, 600, VIEW_H - 96, 26, 84, 6);
  ctx.fill();
  ctx.fillStyle = '#ffb020';
  const ty = VIEW_H - 22 - (plane.throttle / 100) * 68;
  roundRect(ctx, 596, ty, 34, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#e8f6ff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`THR ${Math.round(plane.throttle)}%`, 640, VIEW_H - 58);
  // Fuel and hull bars.
  const bar = (x, y, label, frac, colour) => {
    ctx.fillStyle = '#0e1a2e';
    roundRect(ctx, x, y, 180, 14, 7);
    ctx.fill();
    ctx.fillStyle = colour;
    roundRect(ctx, x, y, 180 * Math.max(0, Math.min(1, frac)), 14, 7);
    ctx.fill();
    ctx.fillStyle = '#e8f6ff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${label} ${Math.round(frac * 100)}%`, x, y - 6);
  };
  bar(760, VIEW_H - 78, 'FUEL', plane.fuel / 100, plane.fuel < 25 ? '#ff5a4e' : '#57e389');
  bar(760, VIEW_H - 44, 'HULL', plane.hull / 100, plane.hull < 30 ? '#ff5a4e' : '#7fe3ff');
  ctx.fillStyle = '#9db8d6';
  ctx.font = '11px sans-serif';
  ctx.fillText(mission.name, 980, VIEW_H - 78);
  ctx.fillStyle = '#e8f6ff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`RINGS ${plane.ringsHit}/${mission.rings}`, 980, VIEW_H - 52);
  ctx.restore();
}

function drawHud(ctx, plane, mission, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,18,32,0.55)';
  roundRect(ctx, 16, 14, VIEW_W - 32, 54, 10);
  ctx.fill();
  ctx.fillStyle = COLOURS.hud;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ALT ${Math.round(plane.altitude)} m`, 32, 38);
  ctx.fillText(`SPD ${Math.round(plane.speed)} kt`, 232, 38);
  ctx.fillText(`HDG ${String(Math.round(plane.heading)).padStart(3, '0')}°`, 432, 38);
  ctx.fillStyle = COLOURS.hudAmber;
  ctx.fillText(`SCORE ${plane.score}`, 640, 38);
  ctx.fillStyle = COLOURS.hud;
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(plane.distance)} / ${mission.distance} m`, VIEW_W - 32, 38);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#cfe6ff';
  ctx.textAlign = 'left';
  ctx.fillText(`${mission.name} · ${mission.subtitle}`, 32, 58);
  // Compass strip.
  ctx.fillStyle = 'rgba(10,18,32,0.55)';
  roundRect(ctx, VIEW_W / 2 - 180, 78, 360, 22, 8);
  ctx.fill();
  ctx.fillStyle = '#e8f6ff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  for (let d = -60; d <= 60; d += 30) {
    const h = Math.round(((plane.heading + d) % 360 + 360) % 360);
    ctx.fillText(`${String(h).padStart(3, '0')}`, VIEW_W / 2 + d * 3, 93);
  }
  ctx.fillStyle = '#ffb020';
  ctx.beginPath();
  ctx.moveTo(VIEW_W / 2, 78);
  ctx.lineTo(VIEW_W / 2 - 6, 70);
  ctx.lineTo(VIEW_W / 2 + 6, 70);
  ctx.closePath();
  ctx.fill();
  if (plane.fuel < 25) {
    ctx.fillStyle = COLOURS.hudRed;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOW FUEL — FLY A RING TO REFUEL', VIEW_W / 2, 132);
  }
  const ring = world.rings.find((r) => !r.passed && !r.missed);
  if (ring) {
    ctx.fillStyle = 'rgba(10,18,32,0.65)';
    roundRect(ctx, VIEW_W / 2 - 260, 106, 520, 26, 9);
    ctx.fill();
    ctx.fillStyle = '#ffdf6b';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    const dir = ring.lateral > plane.lateral + 0.08 ? '◀ TURN RIGHT' : ring.lateral < plane.lateral - 0.08 ? 'TURN LEFT ▶' : 'ON COURSE';
    ctx.fillText(`NEXT RING ${ring.index + 1} · ${Math.max(0, Math.round(ring.distance - plane.distance))} m · ${dir}`, VIEW_W / 2, 122);
  }
  ctx.restore();
}

export function render(ctx, game) {
  const { plane, mission, world, time, state } = game;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawSky(ctx, mission, time);
  drawClouds(ctx, world, time);
  drawMountains(ctx, plane, world);
  drawGround(ctx, plane, world);
  drawRunway(ctx, plane, world);
  drawRings(ctx, plane, world);
  drawPlane(ctx, plane);
  drawHud(ctx, plane, mission, world);
  drawPanel(ctx, plane, mission);

  if (state === 'menu') {
    ctx.save();
    ctx.fillStyle = 'rgba(6,12,24,0.62)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('MERAPI SKY COURIER', VIEW_W / 2, 168);
    ctx.fillStyle = '#ffdf6b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Fly the ridge. Thread the rings. Land on runway 09.', VIEW_W / 2, 208);
    ctx.fillStyle = '#e8f6ff';
    ctx.font = '18px sans-serif';
    MISSIONS.forEach((m, i) => {
      const y = 268 + i * 74;
      ctx.fillStyle = i === game.missionIndex ? '#ffb020' : '#e8f6ff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`${m.key}. ${m.name} — ${m.subtitle}`, VIEW_W / 2, y);
      ctx.fillStyle = '#cfe6ff';
      ctx.font = '15px sans-serif';
      ctx.fillText(m.blurb, VIEW_W / 2, y + 24);
    });
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press 1, 2 or 3 to fly · ↑/↓ throttle · ←/→ bank · SPACE climb · X descend', VIEW_W / 2, 520);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#cfe6ff';
    ctx.fillText('Mouse steers gently too. P pauses, R restarts. Rings refuel you. Land slow, level and centred.', VIEW_W / 2, 548);
    ctx.restore();
  }
  if (state === 'paused') {
    ctx.save();
    ctx.fillStyle = 'rgba(6,12,24,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2 - 10);
    ctx.font = '18px sans-serif';
    ctx.fillText('Press P to keep flying · R to restart', VIEW_W / 2, VIEW_H / 2 + 28);
    ctx.restore();
  }
  if (state === 'crashed' || state === 'landed' || state === 'complete') {
    ctx.save();
    ctx.fillStyle = 'rgba(6,12,24,0.62)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = state === 'crashed' ? '#ff5a4e' : '#57e389';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      state === 'crashed' ? 'CRASHED' : state === 'landed' ? 'LANDED — RUNWAY 09' : 'MISSION COMPLETE',
      VIEW_W / 2,
      240,
    );
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(plane.crashReason || `Score ${plane.score} · Rings ${plane.ringsHit}/${mission.rings} · ${Math.round(plane.distance)} m`, VIEW_W / 2, 286);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffdf6b';
    ctx.fillText(`SCORE ${plane.score}`, VIEW_W / 2, 330);
    ctx.fillStyle = '#e8f6ff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Press R to fly again · 1 / 2 / 3 for another mission', VIEW_W / 2, 372);
    ctx.restore();
  }
}
