import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Button, ButtonGroup } from '../../src/ui'

test('ButtonGroup horizontal orientation adds left border on subsequent items', async ({ mount, page }) => {
  await mount(
    <ButtonGroup>
      <Button>One</Button>
      <Button>Two</Button>
    </ButtonGroup>,
  )

  const twoWrapper = page.getByRole('button', { name: 'Two' }).locator('xpath=ancestor::div[1]')
  await expect(twoWrapper).toHaveClass(/border-l/)
})

