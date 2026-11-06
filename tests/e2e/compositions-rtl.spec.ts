import { expect, test } from '@playwright/test'
import { compositionGroups } from '../../src/modules/compositions/views'

// Grouped by family so each test stays bounded and lazy-route failures are local.
for (const group of compositionGroups) {
  test(`Arabic dark compositions: ${group.id}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.addInitScript(() => {
      localStorage.setItem('foundation:language', 'ar')
      localStorage.setItem('foundation:theme', 'dark')
    })
    for (const view of group.views) {
      await page.goto(`/compositions?view=${view}`)
      const example = page.locator(`[data-composition="${view}"]`)
      await expect(
        example.locator('[data-slot=card], button, table').first(),
      ).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      await expect(page.locator('html')).toHaveClass(/dark/)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
        view,
      ).toBeLessThanOrEqual(0)
      expect(errors, view).toEqual([])
    }
  })
}
