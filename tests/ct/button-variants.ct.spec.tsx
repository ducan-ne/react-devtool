import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Button } from '../../src/ui'

test('Button destructive and ghost variants apply classes', async ({ mount, page }) => {
  await mount(
    <div>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
    </div>,
  )

  const ghost = page.getByRole('button', { name: 'Ghost' })
  const destructive = page.getByRole('button', { name: 'Delete' })

  await expect(ghost).toHaveClass(/hover:bg-neutral-800/)
  await expect(destructive).toHaveClass(/bg-red-600/)
})

