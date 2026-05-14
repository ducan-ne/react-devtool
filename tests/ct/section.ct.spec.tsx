import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Section } from '../../src/ui'

test('Section collapsible toggles content visibility', async ({ mount, page }) => {
  await mount(
    <Section title="More" collapsible defaultCollapsed>
      <div>Details</div>
    </Section>,
  )

  await expect(page.getByText('Details')).toBeHidden()
  await page.getByText('More').click()
  await expect(page.getByText('Details')).toBeVisible()
})

