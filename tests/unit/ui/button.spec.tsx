import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../../../src/ui'

describe('Button', () => {
  it('applies default variant classes', () => {
    render(<Button>Click</Button>)
    const btn = screen.getByRole('button', { name: 'Click' })
    const classes = btn.className
    expect(classes).toContain('bg-[#18181B]')
  })

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const btn = screen.getByRole('button', { name: 'Outline' })
    const classes = btn.className
    expect(classes).toContain('border-neutral-600')
  })

  it('applies ghost and destructive variants', () => {
    render(
      <>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
      </>,
    )

    const ghost = screen.getByRole('button', { name: 'Ghost' })
    const destructive = screen.getByRole('button', { name: 'Delete' })

    expect(ghost.className).toContain('hover:bg-neutral-800')
    expect(destructive.className).toContain('bg-red-600')
  })

  it('applies size classes: sm and lg', () => {
    render(
      <>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </>,
    )

    const sm = screen.getByRole('button', { name: 'Small' })
    const lg = screen.getByRole('button', { name: 'Large' })

    expect(sm.className).toContain('h-7')
    expect(lg.className).toContain('h-9')
  })
})
