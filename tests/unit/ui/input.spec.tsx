import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '../../../src/ui'

describe('Input', () => {
  it('associates label with input via id', () => {
    render(<Input label="Username" placeholder="Type" />)
    const label = screen.getByText('Username') as HTMLLabelElement
    const input = screen.getByPlaceholderText('Type') as HTMLInputElement
    expect(label.htmlFor).toBeTruthy()
    expect(input.id).toBe(label.htmlFor)
  })

  it('renders error over help text and applies error class', () => {
    const { rerender } = render(
      <Input label="Email" helpText="We never share your email" placeholder="you@acme.com" />,
    )
    // Help text initially visible
    expect(screen.getByText('We never share your email')).toBeTruthy()

    rerender(
      <Input label="Email" error="Required" placeholder="you@acme.com" />,
    )

    // Error text replaces help text
    expect(screen.getByText('Required')).toBeTruthy()
    const input = screen.getByPlaceholderText('you@acme.com') as HTMLInputElement
    expect(input.className).toContain('border-red-500')
  })
})
