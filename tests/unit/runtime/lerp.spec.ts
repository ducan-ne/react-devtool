import { describe, it, expect } from 'vitest'

import { lerp } from '../../../src/devtool/utils/lerp'

describe('utils/lerp', () => {
  it('interpolates between numbers', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
    expect(lerp(0, 10, 0.5)).toBe(5)
  })

  it('works with negative ranges', () => {
    expect(lerp(-10, 10, 0.25)).toBe(-5)
    expect(lerp(-10, -20, 0.5)).toBe(-15)
  })
})

