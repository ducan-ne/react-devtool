import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { Inspector } from '../../src/ui'

test('Inspector renders object keys and values', async ({ mount, page }) => {
  await mount(<Inspector data={{ foo: 'bar', count: 1 }} expandLevel={1} />)

  await expect(page.getByText('foo').first()).toBeVisible()
  await expect(page.getByText('bar').first()).toBeVisible()
  await expect(page.getByText('count').first()).toBeVisible()
  await expect(page.getByText('1').first()).toBeVisible()
})

