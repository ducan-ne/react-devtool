import { describe, it, expect, vi } from 'vitest'

import { createStore } from '../../../src/devtool/utils/create-store'

describe('utils/create-store', () => {
  it('creates store with initial state and exposes getters', () => {
    const store = createStore<{ a: number; b: number }>((set, get) => {
      return { a: 1, b: 2 }
    })

    expect(store.getState()).toEqual({ a: 1, b: 2 })
    expect(store.getInitialState()).toEqual({ a: 1, b: 2 })
  })

  it('setState merges by default and supports updater function', () => {
    const store = createStore<{ a: number; b: number }>((set, get) => {
      return { a: 1, b: 2 }
    })

    store.setState({ b: 3 })
    expect(store.getState()).toEqual({ a: 1, b: 3 })

    store.setState((s) => ({ a: s.a + 1 }))
    expect(store.getState()).toEqual({ a: 2, b: 3 })
  })

  it('supports replace mode', () => {
    const store = createStore<{ a: number; b: number }>(() => ({ a: 1, b: 2 }))
    store.setState({ a: 9 } as any, true)
    expect(store.getState()).toEqual({ a: 9 })
  })

  it('subscribe (no selector) receives new and previous state', () => {
    const store = createStore<{ a: number; b: number }>(() => ({ a: 0, b: 0 }))
    const listener = vi.fn()
    const unsub = store.subscribe(listener)

    store.setState({ a: 1 })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0]?.[0]).toEqual({ a: 1, b: 0 })
    expect(listener.mock.calls[0]?.[1]).toEqual({ a: 0, b: 0 })

    unsub()
    store.setState({ a: 2 })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('subscribe with selector only notifies on selected slice changes', () => {
    const store = createStore<{ a: number; b: number }>(() => ({ a: 0, b: 0 }))
    const onA = vi.fn()
    const unsub = store.subscribe(
      (s) => s.a,
      (a, prevA) => onA(a, prevA),
    )

    store.setState({ b: 1 })
    expect(onA).not.toHaveBeenCalled()

    store.setState({ a: 1 })
    expect(onA).toHaveBeenCalledTimes(1)
    expect(onA.mock.calls[0]).toEqual([1, 0])

    unsub()
  })
})

