import { expect, test } from '@playwright/test'

// Regression: a table whose rows fit must not trap the mouse wheel. Vertical
// overscroll containment on its scroll wrapper stopped the page from scrolling.
test('the mouse wheel over a table scrolls the page', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Touch devices scroll by dragging, not with a wheel.')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/design-system?tab=catalog')
  const table = page.locator('[data-slot="data-table"]')
  await expect(table.getByRole('row').nth(5)).toBeVisible()
  const box = (await table.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, Math.min(box.y + 120, 760))
  await page.mouse.wheel(0, 600)
  await expect
    .poll(() => page.evaluate(() => document.scrollingElement!.scrollTop))
    .toBeGreaterThan(300)
})
