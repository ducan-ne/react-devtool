import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Select } from '../../src/ui'

test('Select focuses when clicking label and renders disabled placeholder', async ({ mount, page }) => {
  await mount(
    <Select label="Env" placeholder="Pick one">
      <option value="dev">Dev</option>
    </Select>,
  )

  const label = page.getByText('Env')
  const select = page.getByLabel('Env')

  await label.click()
  await expect(select).toBeFocused()

  const placeholder = page.getByText('Pick one')
  await expect(placeholder).toHaveAttribute('disabled', '')
})

