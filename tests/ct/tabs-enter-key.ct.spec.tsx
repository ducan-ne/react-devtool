import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Tabs, Tab } from '../../src/ui'

test('Tabs switches when pressing Enter on a tab (button behavior)', async ({ mount, page }) => {
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

  const tabTwo = page.getByRole('tab', { name: 'Two' })
  await tabTwo.focus()
  await page.keyboard.press('Enter')

  await expect(page.getByText('Panel Two')).toBeVisible()
})

