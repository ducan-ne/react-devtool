import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Button, ButtonGroup } from '../../src/ui'

test('ButtonGroup supports vertical orientation', async ({ mount, page }) => {
  await mount(
    <ButtonGroup orientation="vertical">
      <Button>One</Button>
      <Button>Two</Button>
    </ButtonGroup>,
  )

  const group = page.locator('div.inline-flex')
  await expect(group).toHaveClass(/flex-col/)
})

