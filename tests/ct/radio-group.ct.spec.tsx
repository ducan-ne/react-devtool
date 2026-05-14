import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { RadioHarness } from './harnesses'

test('RadioGroup switches selection on click', async ({ mount, page }) => {
  await mount(<RadioHarness />)

  const a = page.getByRole('radio', { name: 'A' })
  const b = page.getByRole('radio', { name: 'B' })

  await expect(a).toBeChecked()
  await expect(b).not.toBeChecked()

  await b.click()
  await expect(a).not.toBeChecked()
  await expect(b).toBeChecked()
})

