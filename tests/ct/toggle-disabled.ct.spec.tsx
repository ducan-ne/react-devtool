import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { ToggleDisabledHarness } from './harnesses'

test('Toggle does not change when disabled', async ({ mount, page }) => {
  await mount(<ToggleDisabledHarness />)
  const sw = page.getByRole('switch')
  await expect(sw).toHaveAttribute('aria-checked', 'false')
  await expect(sw).toBeDisabled()
})

