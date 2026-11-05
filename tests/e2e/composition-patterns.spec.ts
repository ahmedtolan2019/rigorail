import { readFile } from 'node:fs/promises'
import { expect, test, type Page, type Download } from '@playwright/test'
import { compositionViews } from '../../src/modules/compositions/views'

async function downloadedText(download: Download) {
  const path = await download.path()
  expect(path).not.toBeNull()
  return readFile(path!, 'utf8')
}
async function click(page: Page, name: string) {
  await page
    .locator('[data-composition]')
    .getByRole('button', { name, exact: true })
    .click()
}
async function confirm(page: Page, name: string) {
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name, exact: true })
    .click()
}
async function notice(page: Page, text: string) {
  await expect(
    page.locator('[data-composition]').getByText(text, { exact: true }),
  ).toBeVisible()
}
test('gallery lists every registered screen and removed URLs fall back to dashboard', async ({
  page,
}) => {
  await page.goto('/compositions')
  await expect(page.locator('[data-composition="dashboard"]')).toBeVisible()
  if ((page.viewportSize()?.width ?? 1280) >= 1024) {
    await expect(
      page
        .getByRole('navigation', { name: 'Examples', exact: true })
        .getByRole('link'),
    ).toHaveCount(compositionViews.length)
  } else {
    await page.getByRole('combobox').first().click()
    await expect(page.getByRole('option')).toHaveCount(compositionViews.length)
    await page.keyboard.press('Escape')
  }
  await page.goto('/compositions?view=saved-views')
  await expect(page.locator('[data-composition="dashboard"]')).toBeVisible()
  await expect(page.locator('[data-composition="saved-views"]')).toHaveCount(0)
})

test('visual master-detail has working order details, status and search recovery', async ({
  page,
}) => {
  await page.goto('/compositions?view=master-detail')
  await page
    .getByRole('button', { name: /Northwind Traders.*SUP-0142/ })
    .click()
  await expect(
    page.getByRole('img', {
      name: 'Illustrative order volume rises over six months.',
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: /PO-3461/ }).click()
  await notice(
    page,
    'Shipment scheduled. Select another order to inspect its progress.',
  )
  await click(page, 'Place on hold')
  await confirm(page, 'Place on hold')
  await expect(
    page.getByRole('button', { name: 'Activate supplier' }),
  ).toBeVisible()
  if ((page.viewportSize()?.width ?? 1280) < 768) await click(page, 'Back')
  await page.getByLabel('Search suppliers').fill('impossible supplier')
  await notice(page, 'No suppliers match your search.')
  await click(page, 'Clear search')
  await expect(
    page.getByRole('button', { name: /Northwind Traders.*SUP-0142/ }),
  ).toBeVisible()
})

test('record attachments download and restore creates a new revision', async ({
  page,
}) => {
  await page.goto('/compositions?view=record-tabs')
  await page.getByRole('tab', { name: /Files/ }).click()
  const download = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Download Quotation-Northwind.txt' })
    .click()
  expect((await download).suggestedFilename()).toBe('Quotation-Northwind.txt')
  expect(await downloadedText(await download)).toContain(
    'Sample quotation for PO-2041',
  )
  await page.goto('/compositions?view=compare')
  await click(page, 'Restore version 2')
  await confirm(page, 'Restore version 2')
  await expect(page.getByLabel('After', { exact: true })).toContainText(
    'Version 4',
  )
})

test('searchable composition navigation reaches an original screen', async ({
  page,
}) => {
  await page.goto('/compositions?view=dashboard')
  if ((page.viewportSize()?.width ?? 1280) >= 1024) {
    await page
      .getByRole('searchbox', { name: 'Find a pattern…' })
      .fill('planner')
    await page
      .getByRole('link', { name: 'Scenario planner', exact: true })
      .click()
  } else {
    await page.getByRole('combobox').first().click()
    await page
      .locator('[data-slot=popover-content]')
      .getByPlaceholder('Find a pattern…')
      .fill('Scenario planner')
    await page.getByRole('option', { name: /Scenario planner/ }).click()
  }
  await expect(page).toHaveURL(/view=planner/)
  await expect(
    page.locator('[data-composition=planner] [role=slider]').first(),
  ).toBeVisible()
})

test('profile message action preserves a visible local draft', async ({
  page,
}) => {
  await page.goto('/compositions?view=profile')
  await click(page, 'Message')
  await page
    .getByRole('dialog')
    .getByLabel('Message draft', { exact: true })
    .fill('Please review the quantities.')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Save message draft' })
    .click()
  await notice(page, 'Local message draft saved.')
  await notice(page, 'Please review the quantities.')
  await click(page, 'Message')
  await expect(
    page.getByRole('dialog').getByLabel('Message draft', { exact: true }),
  ).toHaveValue('Please review the quantities.')
})
