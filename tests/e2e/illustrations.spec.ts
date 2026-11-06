import { expect, test } from '@playwright/test'

test('illustration library loads its assets, searches and copies usable JSX', async ({
  page,
  context,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/design-system?tab=illustrations')
  const cards = page.locator('[data-illustration-card]')
  await expect(cards).toHaveCount(24)
  for (const card of await cards.all()) {
    await card.scrollIntoViewIfNeeded()
    const art = card.locator('img')
    await expect(art).toHaveAttribute('alt', '')
    await expect(art).toHaveAttribute('aria-hidden', 'true')
    await expect
      .poll(() =>
        art.evaluate(
          (image: HTMLImageElement) =>
            image.complete && image.naturalWidth === 400,
        ),
      )
      .toBe(true)
  }
  const search = page.getByRole('searchbox', {
    name: 'Search illustrations or uses',
  })
  await search.fill('workspace')
  await expect(cards).toHaveCount(1)
  await page.getByRole('button', { name: 'Copy JSX for Workspace' }).click()
  await expect(page.getByRole('status')).toContainText('Copied Workspace.')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '<Illustration name="workspace" />',
  )
  await search.fill('a concept that does not exist')
  await expect(page.getByText('No matching illustrations')).toBeVisible()
  await page
    .getByRole('button', { name: 'Clear search', exact: true })
    .last()
    .click()
  await expect(cards).toHaveCount(24)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(0)
  expect(errors).toEqual([])
})

test('Arabic dark library works when clipboard access is unavailable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('foundation:language', 'ar')
    localStorage.setItem('foundation:theme', 'dark')
    localStorage.setItem(
      'foundation:preferences:v1',
      JSON.stringify({
        brand: 'indigo',
        density: 'comfortable',
        shell: 'sidebar',
      }),
    )
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('Clipboard denied')
        },
      },
    })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/design-system?tab=illustrations')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('html')).toHaveAttribute('data-brand', 'indigo')
  await expect
    .poll(() =>
      page.locator('[role="tab"][data-state="active"]').evaluate((tab) => {
        const bounds = tab.getBoundingClientRect()
        const strip = tab.closest('[role="tablist"]')!.getBoundingClientRect()
        return bounds.left >= strip.left && bounds.right <= strip.right
      }),
    )
    .toBe(true)
  await page
    .getByRole('searchbox', { name: 'ابحث عن رسم أو استخدام' })
    .fill('مكتبة')
  const card = page.locator('[data-illustration-card="documents"]')
  await expect(page.locator('[data-illustration-card]')).toHaveCount(1)
  await expect(card.getByRole('heading', { name: 'المستندات' })).toBeVisible()
  await card.getByRole('button').click()
  await expect(page.getByRole('status')).toContainText('الحافظة غير متاحة')
  await expect(card.locator('code')).toHaveText(
    '<Illustration name="documents" />',
  )
  await expect(card.locator('img')).toHaveCSS('animation-name', 'none')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(0)
})

for (const language of ['en', 'ar'] as const) {
  test(`ambient sidebar: ${language} navigation, drawer edge, compact rail and short screens`, async ({
    page,
    isMobile,
  }) => {
    await page.addInitScript(
      (lang) => localStorage.setItem('foundation:language', lang),
      language,
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/requests')
    const trigger = page.locator('[data-sidebar="trigger"]')
    if (isMobile) await trigger.click()
    const art = page.locator('[data-sidebar-illustration]')
    await expect(art).toBeVisible()
    await expect(art).toHaveCSS('pointer-events', 'none')
    await expect(art).toHaveAttribute('aria-hidden', 'true')
    const sidebar = page.locator('[data-sidebar="sidebar"]')
    await expect
      .poll(() =>
        sidebar.evaluate((node, lang) => {
          const rect = node.getBoundingClientRect()
          return Math.round(lang === 'ar' ? innerWidth - rect.right : rect.left)
        }, language),
      )
      .toBe(0)
    const reports = language === 'ar' ? 'التقارير' : 'Reports'
    await page
      .locator('[data-sidebar="sidebar"]')
      .getByRole('link', { name: reports, exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: reports, exact: true }),
    ).toBeVisible()
    if (isMobile) {
      await expect(page.locator('[data-mobile="true"]')).toHaveCount(0)
      await trigger.click()
    } else {
      await trigger.click()
      await expect(art).toBeHidden()
      await trigger.click()
      await expect(art).toBeVisible()
    }
    await page.setViewportSize({
      width: page.viewportSize()!.width,
      height: 600,
    })
    await expect(art).toBeHidden()
  })
}
