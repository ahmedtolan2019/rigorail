import { expect, test, type Page } from '@playwright/test'

// Every list scrolls with the page: its header row pins under the app header (a wide
// list pins a copy that follows its columns) and its pagination pins to the bottom.
// Both are personal preferences on the Appearance page and in each table's View menu.
const headerGap = (page: Page) =>
  page.evaluate(() => {
    const bar = document.querySelector('[data-slot=app-header]')!.getBoundingClientRect().bottom
    const copy = document.querySelector<HTMLElement>('[data-slot=data-table] [aria-hidden=true] table')
    const shown = copy && getComputedStyle(copy.closest<HTMLElement>('[aria-hidden=true]')!).visibility === 'visible'
    const head = shown ? copy : document.querySelector('[data-slot=data-table-head]')!
    return Math.round(head.getBoundingClientRect().top - bar) || 0
  })

test('a long list keeps its column names and pagination in view while the page scrolls', async ({ page }) => {
  await page.goto('/requests?size=50')
  await expect(page.getByRole('heading', { name: 'Requests', exact: true })).toBeVisible()
  await expect(page.locator('[data-slot=data-table] tbody tr').nth(49)).toBeAttached()
  await page.evaluate(() => window.scrollBy(0, 1200))
  await expect.poll(() => headerGap(page)).toBe(0)
  await expect(page.locator('#rows-per-page')).toBeInViewport()
})

test('the table header and pagination preferences are on the Appearance page and in the view menu', async ({ page }) => {
  await page.goto('/appearance')
  const headers = page.getByRole('radiogroup', { name: 'Table headers' })
  await expect(headers.getByRole('radio', { name: 'Pinned' })).toHaveAttribute('aria-checked', 'true')
  await headers.getByRole('radio', { name: 'Scroll away' }).click()
  await expect(headers.getByRole('radio', { name: 'Pinned' })).toHaveAttribute('aria-checked', 'false')
  await page.goto('/requests')
  await page.getByRole('button', { name: /^View\b/ }).click()
  const header = page.getByRole('menuitemcheckbox', { name: 'Pin header row while scrolling' })
  await expect(header).toHaveAttribute('aria-checked', 'false')
  await header.click()
  await expect(header).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('menuitemcheckbox', { name: 'Pin pagination to the bottom' })).toHaveAttribute('aria-checked', 'true')
})
