import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Radio, RadioGroup } from '../../../src/ui'

describe('RadioGroup behavior', () => {
  it('assigns the same name to all radios and triggers onChange', () => {
    const onChange = vi.fn()
    render(
      <RadioGroup value="a" onChange={onChange} label="Group">
        <Radio label="A" value="a" />
        <Radio label="B" value="b" />
      </RadioGroup>,
    )

    const a = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement
    const b = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement

    expect(a.name).toBeTruthy()
    expect(b.name).toBe(a.name)

    // Click B should call onChange with its value
    fireEvent.click(b)
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

