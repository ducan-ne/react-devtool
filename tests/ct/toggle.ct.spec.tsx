import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { ToggleHarness } from './harnesses'

test('Toggle switches aria-checked and knob position', async ({ mount, page }) => {
  await mount(<ToggleHarness />)

  const toggle = page.getByRole('switch')
  await expect(toggle).toHaveAttribute('aria-checked', 'false')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'true')

  // Check that the inner knob moved (translate-x-3)
  const knob = page.locator('button[role="switch"] span')
  await expect(knob).toHaveClass(/translate-x-3/)
})

