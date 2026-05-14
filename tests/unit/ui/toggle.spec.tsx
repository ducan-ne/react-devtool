import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toggle } from '../../../src/ui'

describe('Toggle', () => {
  it('renders with correct aria-checked and toggles on click', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} id="tg" />)

    const toggle = screen.getByRole('switch')
    expect(toggle.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

