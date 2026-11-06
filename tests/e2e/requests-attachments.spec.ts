import { expect, test } from '@playwright/test'

test('attach files to a request with progress, validation, cancel and remove', async ({
  page,
}) => {
  await page.goto('/requests')
  await page.getByRole('link', { name: 'Office equipment' }).first().click()
  const zone = page.getByRole('group', { name: 'Attachments' })
  await expect(zone).toBeVisible()
  // Seeded record already has a supplier quote.
  const list = page.getByRole('list', { name: 'Attachments' })
  await expect(list.getByText('Supplier quote.pdf')).toBeVisible()

  const picker = zone.getByLabel('Attachments')
  await picker.setInputFiles([
    {
      name: 'invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(40_000),
    },
    {
      name: 'script.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.alloc(10),
    },
  ])
  await expect(
    page.getByText('script.exe is not an accepted file type.'),
  ).toBeVisible()
  await expect(
    page.getByRole('progressbar', { name: 'Uploading invoice.pdf' }),
  ).toBeVisible()
  await expect(list.getByText('invoice.pdf')).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveCount(0)

  // Cancelling an upload in flight removes it without attaching.
  await picker.setInputFiles({
    name: 'big.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(2_000_000),
  })
  await page.getByRole('button', { name: 'Cancel upload of big.pdf' }).click()
  await expect(page.getByText('big.pdf')).toHaveCount(0)

  await page.getByRole('button', { name: 'Remove invoice.pdf' }).click()
  await expect(page.getByText('invoice.pdf removed.')).toBeVisible()
  await expect(list.getByText('invoice.pdf')).toHaveCount(0)
})
