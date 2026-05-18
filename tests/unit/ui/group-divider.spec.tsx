import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Divider, Group } from '../../../src/ui'

describe('Divider', () => {
  it('renders a horizontal separator by default', () => {
    render(<Divider />)

    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('renders a labeled separator', () => {
    render(<Divider label="Flags" />)

    expect(screen.getByRole('separator')).toBeTruthy()
    expect(screen.getByText('Flags')).toBeTruthy()
  })
})

describe('Group', () => {
  it('groups a feature section with title, description, actions, and children', () => {
    render(
      <Group
        title="Feature controls"
        description="Tune the active rollout."
        actions={<button type="button">Reset</button>}
      >
        <div>Controls</div>
      </Group>,
    )

    expect(screen.getByRole('heading', { name: 'Feature controls' })).toBeTruthy()
    expect(screen.getByText('Tune the active rollout.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeTruthy()
    expect(screen.getByText('Controls')).toBeTruthy()
  })
})
