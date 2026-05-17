import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
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
    await waitFor(() => expect(renderToDOM).toHaveBeenCalled())
    const first = renderToDOM.mock.calls.length
    flags.value = { b: false }
    await waitFor(() => expect(renderToDOM.mock.calls.length).toBeGreaterThan(first))
  })
})
