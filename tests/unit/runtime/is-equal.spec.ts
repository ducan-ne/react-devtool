import { describe, it, expect } from 'vitest'

import { isEqual } from '../../../src/devtool/core/utils'

describe('core/utils.isEqual', () => {
  it('handles primitives and NaN equality', () => {
    expect(isEqual(1, 1)).toBe(true)
    expect(isEqual(0, -0)).toBe(true)
    expect(isEqual('a', 'a')).toBe(true)
    expect(isEqual(1, '1')).toBe(false)
    // NaN should equal NaN
    expect(isEqual(Number.NaN, Number.NaN)).toBe(true)
  })
})

