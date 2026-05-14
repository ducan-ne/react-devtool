import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { Subscribable } from '../../../src/ui'
import { FeatureFlags } from '../../../src/ui'

describe('Properties subscription cleanup', () => {
  it('calls unsubscribe from values on unmount', () => {
    const unsub = vi.fn()
    const subscribe = vi.fn(() => unsub)
    const stub: Subscribable<Record<string, boolean>> = {
      value: { a: true },
      subscribe,
    } as any

    const { unmount } = render(<FeatureFlags name="Flags" values={stub} />)
    expect(subscribe).toHaveBeenCalled()
    unmount()
    expect(unsub).toHaveBeenCalled()
  })
})

