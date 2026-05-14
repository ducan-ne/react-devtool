import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { values } from '../../../src/devtool'

const renderToDOM = vi.fn()
vi.mock('../../../src/devtool/views/inspector/properties', () => ({
  createPropertyRenderer: () => ({ renderToDOM, unmount: vi.fn() }),
}))

describe('FeatureFlags render behavior', () => {
  it('calls renderer on mount and after value update', async () => {
    const { FeatureFlags } = await import('../../../src/ui')
    const flags = values({ a: true })
    render(<FeatureFlags values={flags} />)
    const first = renderToDOM.mock.calls.length
    flags.value = { b: false }
    expect(renderToDOM.mock.calls.length).toBeGreaterThan(first)
  })
})
