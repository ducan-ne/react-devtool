import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { RadioHarness } from './harnesses'

test('Clicking radio label toggles selection', async ({ mount, page }) => {
  await mount(<RadioHarness />)
  const bLabel = page.getByText('B')
  const bRadio = page.getByRole('radio', { name: 'B' })

  await expect(bRadio).not.toBeChecked()
  await bLabel.click()
  await expect(bRadio).toBeChecked()
})

