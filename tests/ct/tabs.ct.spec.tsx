import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { TabsHarness } from './harnesses'

test('Tabs switches panels on tab click', async ({ mount, page }) => {
  await mount(<TabsHarness />)

  await expect(page.getByText('Panel One')).toBeVisible()
  await page.getByRole('tab', { name: 'Two' }).click()
  await expect(page.getByText('Panel Two')).toBeVisible()
})

