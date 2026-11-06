import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Automated WCAG 2.2 A/AA checks on representative screens. They catch roughly a
// third of issues; keyboard and screen-reader review still apply to new flows.
async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(' | ')}`,
  )
}

const screens = [
  { path: '/requests', ready: 'Requests' },
  { path: '/requests/north-1', ready: 'Office equipment' },
  { path: '/requests/new', ready: 'New request' },
  { path: '/reports', ready: 'Reports' },
  { path: '/account', ready: 'Account' },
  { path: '/appearance', ready: 'Appearance' },
  { path: '/access', ready: 'Access' },
]

for (const { path, ready } of screens)
  test(`no automated accessibility violations: ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(
      page.getByRole('heading', { name: ready, level: 1 }),
    ).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(await audit(page)).toEqual([])
  })

test('no automated accessibility violations: Arabic dark sign-in', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('foundation:language', 'ar')
    localStorage.setItem('foundation:theme', 'dark')
    sessionStorage.setItem('demo:signed-out', '1')
  })
  await page.goto('/sign-in')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await audit(page)).toEqual([])
})

for (const { path, ready } of screens.slice(0, 4))
  test(`no automated accessibility violations in dark mode: ${path}`, async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem('foundation:theme', 'dark'),
    )
    await page.goto(path)
    await expect(
      page.getByRole('heading', { name: ready, level: 1 }),
    ).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(await audit(page)).toEqual([])
  })

// The design system is what agents copy from first, so it meets the same bar.
for (const theme of ['light', 'dark'] as const)
  for (const tab of [
    'foundations',
    'components',
    'patterns',
    'illustrations',
    'catalog',
  ])
    test(`no automated accessibility violations: design system ${tab} (${theme})`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem('foundation:theme', value),
        theme,
      )
      await page.goto(`/design-system?tab=${tab}`)
      await expect(
        page.getByRole('heading', { name: 'Design system', level: 1 }),
      ).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(await audit(page)).toEqual([])
    })
