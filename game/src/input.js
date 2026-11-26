// Merapi Sky Courier — keyboard and mouse input.
// One clear job: turn raw events into a small, testable input state
// (throttle keys, bank keys, climb, pause, restart, mission picks).
export function createInput(canvas) {
  const keys = new Set();
  const state = {
    throttleUp: false,
    throttleDown: false,
    bankLeft: false,
    bankRight: false,
    climb: false,
    descend: false,
    mouseX: 0.5,
    mouseActive: false,
  };

  function refresh() {
    state.throttleUp = keys.has('ArrowUp') || keys.has('KeyW');
    state.throttleDown = keys.has('ArrowDown') || keys.has('KeyS');
    state.bankLeft = keys.has('ArrowLeft') || keys.has('KeyA');
    state.bankRight = keys.has('ArrowRight') || keys.has('KeyD');
    state.climb = keys.has('Space');
    state.descend = keys.has('KeyX') || keys.has('ShiftLeft');
  }

  const pressed = new Set();
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
    refresh();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    refresh();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    refresh();
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    state.mouseX = (e.clientX - r.left) / Math.max(1, r.width);
    state.mouseActive = true;
  });
  canvas.addEventListener('mousedown', () => {
    pressed.add('MouseClick');
  });

  return {
    state,
    // Consume a one-shot press (Enter, R, P, 1/2/3, mouse click).
    consume(code) {
      if (pressed.has(code)) {
        pressed.delete(code);
        return true;
      }
      return false;
    },
    clearPresses() {
      pressed.clear();
    },
  };
}
