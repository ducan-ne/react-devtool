import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Tabs, Tab } from '../../src/ui'

test('Tabs switches when clicking a tab button', async ({ mount, page }) => {
  await mount(
    <Tabs defaultValue="one">
      <Tab label="One" value="one">
        <div>Panel One</div>
      </Tab>
      <Tab label="Two" value="two">
        <div>Panel Two</div>
      </Tab>
    </Tabs>,
  )

  await expect(page.getByText('Panel One')).toBeVisible()
  await page.getByRole('tab', { name: 'Two' }).click()
  await expect(page.getByText('Panel Two')).toBeVisible()
})

