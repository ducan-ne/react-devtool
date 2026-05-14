import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { values, flags, useFlag } from '../../src/devtool'

describe('devtool values/flags', () => {
  it('values publishes updates via subscribe', () => {
    const state = values({ count: 0 })
    const events: Array<{ count: number }> = []

    const unsub = state.subscribe((v) => {
      events.push(v)
    })

    state.value = { count: 1 }
    state.value = { count: 2 }

    expect(events.length).toBeGreaterThanOrEqual(2)
    expect(events.at(-1)).toEqual({ count: 2 })

    unsub()
  })

  it('flags works with useFlag hook', () => {
    const featureFlags = flags({ featureA: false })

    function Probe() {
      const isEnabled = useFlag(featureFlags, 'featureA')
      return <span data-testid="flag">{String(isEnabled)}</span>
    }

    render(<Probe />)
    expect(screen.getByTestId('flag').textContent).toBe('false')

    act(() => {
      featureFlags.value = { featureA: true }
    })

    expect(screen.getByTestId('flag').textContent).toBe('true')
  })

  it('unsubscribe prevents further notifications from values', () => {
    const state = values({ count: 0 })
    const seen: Array<number> = []
    const unsub = state.subscribe((v) => seen.push(v.count))

    state.value = { count: 1 }
    unsub()
    state.value = { count: 2 }

    // We should have only captured the first update after subscribe
    expect(seen).toEqual([1])
  })
})
