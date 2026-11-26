// Merapi Sky Courier — synthesized sound, no audio files.
// One clear job: engine hum, ring chime, warning and landing tones,
// all made with WebAudio so the game stays fully offline.
export function createAudio() {
  let ctx = null;
  let engine = null;
  let engineGain = null;
  let started = false;

  function ensure() {
    if (started) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engine = ctx.createOscillator();
      engine.type = 'sawtooth';
      engine.frequency.value = 62;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      engine.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(ctx.destination);
      engine.start();
      started = true;
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when = 0) {
    if (!ensure() || !ctx) return;
    try {
      const t0 = ctx.currentTime + when;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    } catch {
      // Sound is garnish; a failure never stops the game.
    }
  }

  return {
    unlock() {
      ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    setEngine(throttle, flying) {
      if (!ensure() || !ctx || !engine || !engineGain) return;
      engine.frequency.value = 52 + throttle * 0.9;
      engineGain.gain.value = flying ? 0.015 + (throttle / 100) * 0.03 : 0;
    },
    ring() {
      tone(880, 0.18, 'sine', 0.12);
      tone(1318, 0.28, 'sine', 0.1, 0.09);
    },
    warning() {
      tone(220, 0.22, 'square', 0.05);
    },
    landed() {
      tone(523, 0.2, 'sine', 0.12);
      tone(659, 0.2, 'sine', 0.12, 0.14);
      tone(784, 0.4, 'sine', 0.12, 0.28);
    },
    crash() {
      tone(110, 0.5, 'sawtooth', 0.12);
      tone(55, 0.7, 'sawtooth', 0.1, 0.1);
    },
  };
}
