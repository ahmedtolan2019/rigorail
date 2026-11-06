import { expect, test } from '@playwright/test'

test('a request prints as a clean document without navigation or controls', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Print layout is device independent.')
  await page.goto('/requests/north-1')
  await expect(
    page.getByRole('heading', { name: 'Office equipment' }),
  ).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('[data-slot="sidebar-container"]')).toBeHidden()
  await expect(page.locator('header').first()).toBeHidden()
  await expect(page.getByRole('group', { name: 'Actions' })).toBeHidden()
  await expect(
    page.getByRole('link', { name: 'Back to requests' }),
  ).toBeHidden()
  await expect(page.getByText(/^Rigorail · /)).toBeVisible()
  await expect(page.getByText('REQ-1240')).toBeVisible()
  if (process.env.PRINT_PREVIEW)
    await page.pdf({ path: process.env.PRINT_PREVIEW, format: 'A4' })
})
