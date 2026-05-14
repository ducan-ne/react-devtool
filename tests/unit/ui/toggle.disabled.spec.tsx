import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toggle } from '../../../src/ui'

describe('Toggle (disabled)', () => {
  it('does not call onChange when disabled', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} disabled id="tg2" />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('disabled')
    fireEvent.click(toggle)
    expect(onChange).not.toHaveBeenCalled()
  })
})

