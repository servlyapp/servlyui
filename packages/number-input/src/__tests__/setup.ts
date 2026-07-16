import '@testing-library/jest-dom/vitest';

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
}

Object.defineProperty(document, 'pointerLockElement', {
  configurable: true,
  value: null,
});

document.exitPointerLock = document.exitPointerLock || (() => undefined);
