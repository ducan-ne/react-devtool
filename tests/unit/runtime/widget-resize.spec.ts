import { beforeEach, describe, expect, it } from 'vitest'
import {
  calculateNewSizeAndPosition,
  getHandleVisibility,
} from '../../../src/devtool/widget/helpers'

describe('widget resize helpers', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1000,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 800,
    })
    document.body.dir = 'ltr'
  })

  it('resizes width and height together from a corner handle', () => {
    const { newSize, newPosition } = calculateNewSizeAndPosition(
      'top-left',
      { width: 620, height: 460 },
      { x: 120, y: 140 },
      -50,
      -60,
    )

    expect(newSize).toEqual({ width: 670, height: 520 })
    expect(newPosition).toEqual({ x: 70, y: 80 })
  })

  it('keeps the opposite edge anchored when resizing from bottom-right', () => {
    const { newSize, newPosition } = calculateNewSizeAndPosition(
      'bottom-right',
      { width: 620, height: 460 },
      { x: 120, y: 140 },
      40,
      30,
    )

    expect(newSize).toEqual({ width: 660, height: 490 })
    expect(newPosition).toEqual({ x: 120, y: 140 })
  })

  it('only shows the diagonal corner handle that can resize both axes normally', () => {
    expect(getHandleVisibility('top-left', 'bottom-right', false, false)).toBe(true)
    expect(getHandleVisibility('top-right', 'bottom-right', false, false)).toBe(false)
    expect(getHandleVisibility('bottom-left', 'bottom-right', false, false)).toBe(false)
    expect(getHandleVisibility('bottom-right', 'bottom-right', false, false)).toBe(false)
  })

  it('keeps corner handles available for the resizable axis while maximized', () => {
    expect(getHandleVisibility('top-right', 'bottom-right', true, false)).toBe(true)
    expect(getHandleVisibility('bottom-left', 'bottom-right', true, false)).toBe(false)
    expect(getHandleVisibility('bottom-left', 'bottom-right', false, true)).toBe(true)
    expect(getHandleVisibility('top-right', 'bottom-right', false, true)).toBe(false)
    expect(getHandleVisibility('bottom-right', 'bottom-right', true, true)).toBe(true)
  })
})
