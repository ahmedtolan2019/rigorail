import { expect, test } from '@playwright/test'

test('a request prints as a designed document from a print preview', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Print layout is device independent.')
  await page.goto('/requests/north-1')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Print' }).click()
  const preview = page.getByRole('dialog', { name: 'Print preview' })
  await expect(preview).toBeVisible()
  await expect(preview.getByText('REQ-1240').first()).toBeVisible()
  // Printing outputs only the document: no navigation, controls or page behind it.
  await page.emulateMedia({ media: 'print' })
  const document = page.locator('[data-print-root]')
  await expect(document).toBeVisible()
  await expect(document).toContainText('REQ-1240')
  await expect(page.locator('[data-slot="sidebar-container"]')).toBeHidden()
  await expect(page.locator('main')).toBeHidden()
  if (process.env.PRINT_PREVIEW)
    await page.pdf({ path: process.env.PRINT_PREVIEW, format: 'A4' })
})
