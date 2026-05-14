import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Select } from '../../../src/ui'

describe('Select', () => {
  it('associates label/id and shows placeholder', () => {
    render(
      <Select label="Env" placeholder="Pick one">
        <option value="dev">Dev</option>
      </Select>,
    )
    const select = screen.getByLabelText('Env')
    expect(select).toBeTruthy()
    const placeholder = screen.getByText('Pick one')
    expect(placeholder).toBeTruthy()
    expect(placeholder).toHaveAttribute('disabled')
  })

  it('shows error and hides help when error present', () => {
    render(
      <Select label="Env" helpText="Choose wisely" error="Required">
        <option value="dev">Dev</option>
      </Select>,
    )
    expect(screen.getByText('Required')).toBeTruthy()
    expect(screen.queryByText('Choose wisely')).toBeNull()
  })
})

