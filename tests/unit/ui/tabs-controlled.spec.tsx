import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs, Tab } from '../../../src/ui'

describe('Tabs (controlled)', () => {
  it('calls onValueChange when clicking a different tab', () => {
    const onValueChange = vi.fn()
    render(
      <Tabs value="one" onValueChange={onValueChange}>
        <Tab label="One" value="one">
          <div>Panel One</div>
        </Tab>
        <Tab label="Two" value="two">
          <div>Panel Two</div>
        </Tab>
      </Tabs>,
    )

    // Click on tab Two should trigger callback
    const tabTwo = screen.getByRole('tab', { name: 'Two' })
    fireEvent.click(tabTwo)
    expect(onValueChange).toHaveBeenCalledWith('two')

    // Since component is controlled and value not updated externally,
    // the visible panel should remain Panel One
    expect(screen.getByText('Panel One')).toBeTruthy()
  })
})

