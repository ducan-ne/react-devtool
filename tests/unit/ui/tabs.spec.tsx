import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs, Tab } from '../../../src/ui'

describe('Tabs', () => {
  it('uncontrolled: switches content when clicking a tab', () => {
    render(
      <Tabs defaultValue="one">
        <Tab label="One" value="one">
          <div>Panel One</div>
        </Tab>
        <Tab label="Two" value="two">
          <div>Panel Two</div>
        </Tab>
      </Tabs>,
    )

    expect(screen.getByText('Panel One')).toBeTruthy()
    const tabTwo = screen.getByRole('tab', { name: 'Two' })
    fireEvent.click(tabTwo)
    expect(screen.getByText('Panel Two')).toBeTruthy()
  })

  it('controlled: calls onValueChange and respects value prop', () => {
    function Harness() {
      const [value, setValue] = React.useState('one')
      const onValueChange = vi.fn((v: string) => setValue(v))
      const content = value === 'one' ? 'Panel One' : 'Panel Two'
      return (
        <Tabs value={value} onValueChange={onValueChange}>
          <Tab label="One" value="one">
            <div>{content}</div>
          </Tab>
          <Tab label="Two" value="two">
            <div>{content}</div>
          </Tab>
        </Tabs>
      )
    }

    render(<Harness />)
    expect(screen.getByText('Panel One')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByText('Panel Two')).toBeTruthy()
  })
})

