import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Input } from '../../src/ui'

test('Input associates label and displays error text', async ({ mount, page }) => {
  await mount(
    <div className="space-y-3">
      <Input label="Email" placeholder="you@acme.com" />
      <Input label="Password" placeholder="••••••" error="Required" />
    </div>,
  )

  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByText('Required')).toBeVisible()
})

