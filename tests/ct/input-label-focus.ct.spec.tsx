import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Input } from '../../src/ui'

test('Input focuses when clicking its label', async ({ mount, page }) => {
  await mount(<Input label="Email" placeholder="you@example.com" />)

  const label = page.getByText('Email')
  const input = page.getByLabel('Email')

  await expect(input).toBeVisible()
  await label.click()
  await expect(input).toBeFocused()
})

