import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { RadioHarness } from './harnesses'

test('RadioGroup changes selection with arrow keys', async ({ mount, page }) => {
  await mount(<RadioHarness />)

  const aRadio = page.getByRole('radio', { name: 'A' })
  const bRadio = page.getByRole('radio', { name: 'B' })

  await expect(aRadio).toBeChecked()
  await aRadio.focus()
  await page.keyboard.press('ArrowRight')

  await expect(bRadio).toBeChecked()
})

