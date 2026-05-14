import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Inspector } from '../../../src/ui'

describe('Inspector', () => {
  it('renders with provided data and classes', () => {
    // Outer container should include font-mono class
    const { container } = render(<Inspector data={{ foo: 'bar' }} expandLevel={2} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('font-mono')
  })
})

