import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Select } from '../../src/ui'

test('Select associates label and renders placeholder', async ({ mount, page }) => {
  await mount(
    <Select label="Fruit" placeholder="Pick one">
      <option value="apple">Apple</option>
    </Select>,
  )

  // getByLabel resolves the select by its label
  await expect(page.getByLabel('Fruit')).toBeVisible()
  const placeholder = page.locator('option', { hasText: 'Pick one' })
  await expect(placeholder).toHaveAttribute('disabled', '')
})

