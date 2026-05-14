import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { TabsHarness } from './harnesses'

test('Tabs exposes proper aria attributes on tabs', async ({ mount, page }) => {
  await mount(<TabsHarness />)

  const tabOne = page.getByRole('tab', { name: 'One' })
  const tabTwo = page.getByRole('tab', { name: 'Two' })

  await expect(tabOne).toHaveAttribute('aria-selected', 'true')
  await expect(tabTwo).toHaveAttribute('aria-selected', 'false')

  await tabTwo.click()

  await expect(tabOne).toHaveAttribute('aria-selected', 'false')
  await expect(tabTwo).toHaveAttribute('aria-selected', 'true')
})

