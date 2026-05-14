import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, ButtonGroup } from '../../../src/ui'

describe('ButtonGroup', () => {
  it('applies horizontal separators (border-l) to items after the first', () => {
    const { container } = render(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    )

    const two = screen.getByRole('button', { name: 'Two' })
    const wrapper = two.closest('div')
    expect(wrapper?.className).toContain('border-l')
    expect(wrapper?.className).toContain('border-neutral-600')

    const one = screen.getByRole('button', { name: 'One' })
    const firstWrapper = one.closest('div')
    expect(firstWrapper?.className).not.toContain('border-l')
  })
})

