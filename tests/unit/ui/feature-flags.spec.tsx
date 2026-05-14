import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { values } from '../../../src/devtool'

const renderToDOM = vi.fn()
const unmount = vi.fn()

vi.mock('../../../src/devtool/views/inspector/properties', () => ({
  createPropertyRenderer: () => ({ renderToDOM, unmount }),
}))

describe('FeatureFlags', () => {
  it('mounts and unmounts renderer', async () => {
    const { FeatureFlags } = await import('../../../src/ui')
    const flags = values({ a: true, b: false })
    const { unmount: doUnmount } = render(<FeatureFlags name="My Flags" values={flags} />)

    expect(renderToDOM).toHaveBeenCalled()
    doUnmount()
  })

  it('re-renders when values change', async () => {
    const { FeatureFlags } = await import('../../../src/ui')
    const flags = values({ a: true })
    render(<FeatureFlags name="Flags" values={flags} />)

    const calls = renderToDOM.mock.calls.length
    flags.value = { a: false, c: true }
    expect(renderToDOM.mock.calls.length).toBeGreaterThan(calls)
  })
})
