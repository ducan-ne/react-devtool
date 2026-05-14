import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Button, ButtonGroup } from '../../src/ui'

test('ButtonGroup horizontal orientation adds row classes and separators', async ({ mount, page }) => {
  await mount(
    <ButtonGroup>
      <Button>One</Button>
      <Button>Two</Button>
      <Button>Three</Button>
    </ButtonGroup>,
  )

  const group = page.locator('div.inline-flex')
  await expect(group).toHaveClass(/flex-row/)

  const wrappers = group.locator('> div')
  // Second and third should have left borders in horizontal mode
  await expect(wrappers.nth(1)).toHaveClass(/border-l/)
  await expect(wrappers.nth(2)).toHaveClass(/border-l/)
})

