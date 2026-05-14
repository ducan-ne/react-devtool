import { describe, it, expect } from 'vitest'

import { getLabelText } from '../../../src/devtool/core/utils'

type Agg = any // Keep loose to avoid depending on internal types

describe('core/utils.getLabelText', () => {
  it('returns null for empty input', () => {
    expect(getLabelText([] as Agg[])).toBeNull()
  })

  it('joins component names by count groups without time', () => {
    const out = getLabelText([
      { name: 'A', aggregatedCount: 1, forget: false, time: 0 },
      { name: 'B', aggregatedCount: 1, forget: false, time: 0 },
    ] as Agg[])
    expect(out).toBe('A, B')
  })

  it('adds count multiplier, sparkle for forget, and cumulative time', () => {
    const out = getLabelText([
      { name: 'C', aggregatedCount: 3, forget: true, time: 0.02 },
      { name: 'D', aggregatedCount: 1, forget: false, time: 0.01 },
    ] as Agg[])
    // Order by count desc, then append total time
    expect(out).toBe('✨C × 3, D (0.03ms)')
  })
})

