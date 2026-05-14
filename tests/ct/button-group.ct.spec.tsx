import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Button, ButtonGroup } from '../../src/ui'

test('ButtonGroup renders horizontal by default', async ({ mount, page }) => {
  await mount(
    <ButtonGroup>
      <Button>One</Button>
      <Button>Two</Button>
    </ButtonGroup>,
  )

  // Both buttons should be visible
  await expect(page.getByRole('button', { name: 'One' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Two' })).toBeVisible()
})

