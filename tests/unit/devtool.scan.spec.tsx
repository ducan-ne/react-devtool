import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Devtool } from '../../src/devtool'

describe('Devtool lifecycle', () => {
  it('mounts and unmounts without throwing', () => {
    const { unmount } = render(
      <Devtool>
        <div data-testid="child">Hello</div>
      </Devtool>,
    )

    expect(() => unmount()).not.toThrow()
  })
})
