import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Radio, RadioGroup } from '../../../src/ui'

describe('RadioGroup', () => {
  it('shares the same name across radios and toggles via onChange', () => {
    function Harness() {
      const [value, setValue] = React.useState('a')
      return (
        <RadioGroup value={value} onChange={setValue} label="Group">
          <Radio label="A" value="a" />
          <Radio label="B" value="b" />
        </RadioGroup>
      )
    }

    render(<Harness />)

    const a = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement
    const b = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement

    expect(a.checked).toBe(true)
    expect(b.checked).toBe(false)

    // Inputs should share the same name attribute
    expect(a.getAttribute('name')).toBeTruthy()
    expect(a.getAttribute('name')).toBe(b.getAttribute('name'))

    // Click label should toggle controlled value
    fireEvent.click(screen.getByText('B'))
    expect(b.checked).toBe(true)
    expect(a.checked).toBe(false)
  })

  it('calls onChange with clicked radio value in controlled mode', () => {
    const onChange = vi.fn()

    function Harness() {
      const [value, setValue] = React.useState('a')
      return (
        <RadioGroup
          value={value}
          onChange={(v) => {
            onChange(v)
            setValue(v)
          }}
          label="Group"
        >
          <Radio label="A" value="a" />
          <Radio label="B" value="b" />
        </RadioGroup>
      )
    }

    render(<Harness />)
    fireEvent.click(screen.getByText('B'))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

