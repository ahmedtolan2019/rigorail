import { expect, test } from '@playwright/test'

// Toolbars mix pickers, inputs and buttons from different components. They must share
// one control height and line up, or the page looks unfinished. This measures every
// row of controls above the content on each list and report page.
const routes = [
  '/requests',
  '/reports',
  '/compositions?view=master-detail',
  '/compositions?view=audit-log',
  '/compositions?view=report-builder',
]

for (const route of routes)
  test(`toolbar controls share one height and baseline on ${route}`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Phone toolbars stack controls by design.')
    await page.goto(route)
    await expect(page.locator('main h1').first()).toBeVisible()
    await page.waitForLoadState('networkidle')
    const rows = await page.evaluate(() => {
      const main = document.querySelector('main')!
      const controls = [
        ...main.querySelectorAll<HTMLElement>(
          'button, input:not([type=checkbox]), [role=combobox]',
        ),
      ].filter((element) => {
        const box = element.getBoundingClientRect()
        return (
          box.height > 24 &&
          box.width > 24 &&
          box.top < 480 &&
          !element.closest(
            'table, [role=tablist], [role=dialog], [data-slot=card], [data-slot=pagination]',
          )
        )
      })
      const groups = new Map<number, { name: string; height: number; top: number }[]>()
      for (const element of controls) {
        const box = element.getBoundingClientRect()
        const key = Math.round((box.top + box.bottom) / 2 / 16)
        const list = groups.get(key) ?? []
        list.push({
          name:
            element.getAttribute('aria-label') ??
            element.textContent?.trim().slice(0, 24) ??
            element.tagName,
          height: Math.round(box.height),
          top: Math.round(box.top),
        })
        groups.set(key, list)
      }
      return [...groups.values()].filter((row) => row.length > 1)
    })
    for (const row of rows) {
      const heights = new Set(row.map((control) => control.height))
      const tops = new Set(row.map((control) => control.top))
      expect(
        heights.size === 1 && tops.size === 1,
        `Misaligned toolbar: ${row.map((control) => `${control.name} ${control.height}px at ${control.top}`).join(', ')}`,
      ).toBe(true)
    }
  })
