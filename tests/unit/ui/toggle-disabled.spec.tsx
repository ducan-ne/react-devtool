import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toggle } from '../../../src/ui'

describe('Toggle (disabled)', () => {
  it('does not invoke onChange when disabled', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} disabled />)
    const toggle = screen.getByRole('switch')

    fireEvent.click(toggle)
    expect(onChange).not.toHaveBeenCalled()
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })
})

