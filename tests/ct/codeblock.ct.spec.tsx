import React from 'react'
import { test, expect } from '@playwright/experimental-ct-react'
import { CodeBlock } from '../../src/ui'

test('CodeBlock displays title and language attribute', async ({ mount, page }) => {
  await mount(
    <CodeBlock title="Snippet" language="ts">
      {`const n: number = 2`}
    </CodeBlock>,
  )

  await expect(page.getByText('Snippet')).toBeVisible()
  const code = page.locator('code')
  await expect(code).toHaveAttribute('data-language', 'ts')
  await expect(code).toContainText('const n: number = 2')
})

