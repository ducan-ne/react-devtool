import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CodeBlock } from '../../../src/ui'

describe('CodeBlock', () => {
  it('renders title and language attribute on code element', () => {
    render(
      <CodeBlock language="ts" title="Example">
        {`const x: number = 1`}
      </CodeBlock>,
    )

    expect(screen.getByText('Example')).toBeTruthy()
    const code = screen.getByText('const x: number = 1').closest('code')
    expect(code).toBeTruthy()
    expect(code?.getAttribute('data-language')).toBe('ts')
  })
})

