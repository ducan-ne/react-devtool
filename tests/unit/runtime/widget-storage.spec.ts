import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LOCALSTORAGE_KEY,
  SESSIONSTORAGE_SIZE_KEY,
} from '../../../src/devtool/constants'

const dimensions = {
  isFullWidth: false,
  isFullHeight: false,
  width: 760,
  height: 520,
  position: { x: 24, y: 24 },
}

describe('widget session size storage', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('uses sessionStorage dimensions over persisted local settings', async () => {
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({
        corner: 'top-left',
        dimensions: {
          ...dimensions,
          width: 550,
          height: 350,
        },
        lastDimensions: {
          ...dimensions,
          width: 550,
          height: 350,
        },
        componentsTree: { width: 240 },
      }),
    )

    sessionStorage.setItem(
      SESSIONSTORAGE_SIZE_KEY,
      JSON.stringify({
        dimensions,
        lastDimensions: {
          ...dimensions,
          width: 820,
          height: 560,
        },
        componentsTree: { width: 320 },
      }),
    )

    const { signalWidget } = await import('../../../src/devtool/state')

    expect(signalWidget.value.corner).toBe('top-left')
    expect(signalWidget.value.dimensions.width).toBe(760)
    expect(signalWidget.value.dimensions.height).toBe(520)
    expect(signalWidget.value.lastDimensions.width).toBe(820)
    expect(signalWidget.value.componentsTree.width).toBe(320)
  })
})
