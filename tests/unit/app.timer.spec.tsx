import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { Timer } from '../../src/app'

describe('Timer component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(global, 'setInterval')
    vi.spyOn(global, 'clearInterval')
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('increments seconds and resets on button click', () => {
    const onCallback = vi.fn()
    render(<Timer onCallback={onCallback} />)

    // Initial text
    expect(screen.getByText(/Timer: 0 second/)).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText(/Timer: 3 seconds/)).toBeTruthy()

    fireEvent.click(screen.getByText('Reset'))
    expect(onCallback).toHaveBeenCalled()
    expect(screen.getByText(/Timer: 0 second/)).toBeTruthy()
  })
})

