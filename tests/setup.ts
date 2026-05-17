import '@testing-library/jest-dom/vitest'

const requestAnimationFramePolyfill = (callback: FrameRequestCallback) =>
  setTimeout(() => callback(performance.now()), 16) as unknown as number

const cancelAnimationFramePolyfill = (handle: number) => {
  clearTimeout(handle)
}

Object.defineProperty(globalThis, 'requestAnimationFrame', {
  configurable: true,
  writable: true,
  value: requestAnimationFramePolyfill,
})

Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  configurable: true,
  writable: true,
  value: cancelAnimationFramePolyfill,
})

Object.defineProperty(window, 'requestAnimationFrame', {
  configurable: true,
  writable: true,
  value: requestAnimationFramePolyfill,
})

Object.defineProperty(window, 'cancelAnimationFrame', {
  configurable: true,
  writable: true,
  value: cancelAnimationFramePolyfill,
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => null,
})
