import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Section } from '../../../src/ui'

describe('Section', () => {
  it('renders static section with title and children', () => {
    render(
      <Section title="Settings">
        <div>Body</div>
      </Section>,
    )
    expect(screen.getByText('Settings')).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
  })

  it('collapsible: defaultCollapsed hides children initially', () => {
    render(
      <Section title="More" collapsible defaultCollapsed>
        <div>Details</div>
      </Section>,
    )
    expect(screen.getByText('More').closest('details')).not.toHaveAttribute('open')
  })
})

