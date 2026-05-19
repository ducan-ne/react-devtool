import React from 'react'
import { beforeEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { values, flags, useFlag } from '../../src/devtool'

describe('devtool values/flags', () => {
  beforeEach(() => {
    localStorage.clear()
  })

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

  it('hydrates persisted flags and merges them with current defaults', () => {
    localStorage.setItem(
      'react-devtool:flags:checkout',
      JSON.stringify({
        source: 'react-devtool.flags',
        value: {
          featureA: true,
          staleFlag: true,
        },
      }),
    )

    const featureFlags = flags(
      {
        featureA: false,
        featureB: true,
      },
      { persist: 'checkout' },
    )

    expect(featureFlags.value).toEqual({
      featureA: true,
      featureB: true,
    })
  })

  it('persists flag changes when persistence is enabled', () => {
    const featureFlags = flags({ featureA: false }, { persist: 'checkout' })

    featureFlags.value = { featureA: true }

    const storedValue = JSON.parse(localStorage.getItem('react-devtool:flags:checkout') ?? '{}')
    expect(storedValue).toEqual({
      source: 'react-devtool.flags',
      value: {
        featureA: true,
      },
    })
  })

  it('supports resetting and clearing persisted flags', () => {
    const featureFlags = flags({ featureA: false }, { persist: 'checkout' })

    featureFlags.value = { featureA: true }
    expect(localStorage.getItem('react-devtool:flags:checkout')).not.toBeNull()

    featureFlags.clearPersisted()
    expect(localStorage.getItem('react-devtool:flags:checkout')).toBeNull()

    featureFlags.value = { featureA: true }
    featureFlags.reset()

    const storedValue = JSON.parse(localStorage.getItem('react-devtool:flags:checkout') ?? '{}')
    expect(featureFlags.value).toEqual({ featureA: false })
    expect(storedValue.value).toEqual({ featureA: false })
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
