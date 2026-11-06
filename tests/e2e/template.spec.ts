import { expect, test, type Page } from '@playwright/test'

/** Follows a main navigation link, opening the mobile sidebar sheet when needed. */
async function navigate(page: Page, name: string | RegExp) {
  const shell = page.locator('[data-shell]')
  await shell.waitFor()
  const mobile = (page.viewportSize()?.width ?? 1280) < 768
  if (mobile && (await shell.getAttribute('data-shell')) === 'sidebar') {
    // Let a previous sheet finish its exit animation, as a user would.
    await expect(page.locator('[data-mobile="true"]')).toHaveCount(0)
    await page.locator('[data-sidebar="trigger"]').click()
  }
  await page
    .locator('[data-sidebar="sidebar"], nav')
    .getByRole('link', { name, exact: typeof name === 'string' })
    .first()
    .click()
}
/** Picks an option in a Radix Select identified by its label. */
async function choose(page: Page, label: string, option: string | RegExp) {
  await page.getByLabel(label, { exact: true }).click()
  await page.getByRole('option', { name: option }).click()
  await expect(page.getByLabel(label, { exact: true })).toContainText(option)
}

test('creates, reviews an AI suggestion, submits and approves a request', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/requests')
  await page.getByRole('link', { name: 'New request', exact: true }).click()
  await page
    .getByLabel('Request', { exact: true })
    .fill('Site inspection equipment')
  await choose(page, 'Category', 'Services')
  await page.getByLabel('Amount', { exact: true }).fill('150.50')
  await page.getByRole('button', { name: 'Suggest description' }).click()
  await expect(
    page.getByRole('button', { name: 'Apply to draft' }),
  ).toBeVisible()
  await expect(page.getByLabel('Description', { exact: true })).toHaveValue('')
  await page.getByRole('button', { name: 'Apply to draft' }).click()
  await expect(page.getByLabel('Description', { exact: true })).not.toHaveValue(
    '',
  )
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(
    page.getByRole('heading', { name: 'Site inspection equipment' }),
  ).toBeVisible()
  await expect(page.getByText('Services', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Submit for approval' }).click()
  await expect(
    page.getByText('Request submitted for approval.', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Approve request' }).click()
  // Approval is final, so it asks first and summarizes the record.
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('Site inspection equipment')
  await confirm.getByRole('button', { name: 'Approve request' }).click()
  await expect(
    page.getByText('Request approved.', { exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('preserves filters on detail return and protects unsaved edits', async ({
  page,
}) => {
  await page.goto('/requests?q=Office&sort=title&dir=asc')
  await page
    .getByRole('link', { name: /Office equipment/ })
    .first()
    .click()
  await page.getByRole('link', { name: 'Back to requests' }).click()
  await expect(
    page.getByRole('searchbox', { name: 'Search requests' }),
  ).toHaveValue('Office')
  await expect(page).toHaveURL(/sort=title/)
  await page.getByRole('link', { name: 'New request', exact: true }).click()
  await page.getByLabel('Request', { exact: true }).fill('Unsaved draft')
  await page.getByRole('link', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Keep editing' }).click()
  await expect(page.getByLabel('Request', { exact: true })).toHaveValue(
    'Unsaved draft',
  )
  await page.getByRole('link', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Discard changes' }).click()
  await expect(
    page.getByRole('heading', { name: 'Requests', exact: true }),
  ).toBeVisible()
})

test('enforces persona, quotas, subscription and flags across navigation', async ({
  page,
}) => {
  await page.goto('/access')
  await choose(page, 'Demo persona', 'Viewer · read only')
  await navigate(page, 'Requests')
  await expect(page.getByRole('button', { name: 'New request' })).toBeDisabled()
  await navigate(page, 'Access')
  await choose(page, 'Demo persona', 'Manager')
  await choose(page, 'Subscription and usage', 'Starter')
  await navigate(page, 'Requests')
  await expect(
    page.getByText('Your workspace has reached its usage limit.'),
  ).toBeVisible()
  await navigate(page, 'Access')
  await choose(page, 'Subscription and usage', 'No subscription')
  await expect(
    page.locator('[data-sidebar="sidebar"], nav').getByRole('link', {
      name: 'Requests',
      exact: true,
    }),
  ).toHaveCount(0)
  // The brand still routes to the module; the direct route is denied.
  // In-app navigation keeps the in-memory demo backend state.
  await navigate(page, /Foundation/)
  await expect(
    page.getByText(
      'Your workspace subscription does not include this feature.',
    ),
  ).toBeVisible()
  await navigate(page, 'Access')
  await choose(page, 'Subscription and usage', 'Pro')
  await choose(page, 'Requests feature flag', 'Disabled')
  await navigate(page, /Foundation/)
  await expect(
    page.getByText('This module is currently disabled.'),
  ).toBeVisible()
})

test('Arabic RTL, Arabic amount entry, appearance and catalog work without page overflow', async ({
  page,
}, testInfo) => {
  await page.goto('/requests')
  await expect(
    page.getByRole('heading', { name: 'Requests', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Office equipment/ }).first(),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('english.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: 'العربية', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(
    page.getByRole('heading', { name: 'الطلبات', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  const firstRecord = await page
    .getByRole('link', { name: /Office equipment/ })
    .first()
    .boundingBox()
  const tableViewport = await page
    .locator('[data-slot="data-table"]')
    .boundingBox()
  expect(firstRecord!.x).toBeGreaterThanOrEqual(tableViewport!.x)
  expect(firstRecord!.x + firstRecord!.width).toBeLessThanOrEqual(
    tableViewport!.x + tableViewport!.width,
  )
  await page.screenshot({
    path: testInfo.outputPath('arabic.png'),
    fullPage: true,
  })
  await page.getByRole('link', { name: 'طلب جديد', exact: true }).click()
  await page.getByLabel('الطلب', { exact: true }).fill('معدات الموقع')
  await page.getByLabel('المبلغ', { exact: true }).fill('١٢٣٫٥٠')
  await page.getByRole('button', { name: 'حفظ المسودة' }).click()
  await expect(
    page.getByRole('heading', { name: 'معدات الموقع' }),
  ).toBeVisible()
  await navigate(page, 'المظهر')
  await page.getByRole('radio', { name: 'داكنة' }).click()
  await page.getByRole('radio', { name: 'قائمة علوية' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('[data-shell]')).toHaveAttribute(
    'data-shell',
    'topbar',
  )
  await navigate(page, 'نظام التصميم')
  await page.getByRole('tab', { name: 'الفهرس' }).click()
  await page.getByRole('searchbox', { name: 'ابحث عن مكون' }).fill('calendar')
  await expect(page.getByText('calendar', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})

test('blocked storage does not break startup or preferences', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Blocked', 'SecurityError')
    }
    Storage.prototype.setItem = () => {
      throw new DOMException('Blocked', 'SecurityError')
    }
  })
  await page.goto('/appearance')
  await page.getByRole('radio', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'العربية', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('workspace switch replaces cached records and business limits', async ({
  page,
}) => {
  await page.goto('/requests')
  await expect(
    page.getByRole('link', { name: /Office equipment/ }).first(),
  ).toHaveAttribute('href', /north-1/)
  await navigate(page, 'Access')
  await choose(page, 'Active workspace', 'South workspace')
  await expect(
    page.getByText('Workspace limit: $2,500.00', { exact: true }),
  ).toBeVisible()
  await navigate(page, 'Requests')
  await expect(
    page.getByRole('link', { name: /Office equipment/ }).first(),
  ).toHaveAttribute('href', /south-1/)
  await page.getByRole('link', { name: 'New request', exact: true }).click()
  await page.getByLabel('Request', { exact: true }).fill('Over budget request')
  await page.getByLabel('Amount', { exact: true }).fill('2501')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(
    page.getByText('The amount exceeds the current workspace limit.'),
  ).toBeVisible()
  await expect(page.getByLabel('Request', { exact: true })).toHaveValue(
    'Over budget request',
  )
})

test('empty searches and missing records/pages offer clear feedback', async ({
  page,
}) => {
  await page.goto('/requests?q=does-not-exist')
  await expect(
    page.getByText('No matching records', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).last().click()
  await expect(
    page.getByRole('link', { name: /Office equipment/ }).first(),
  ).toBeVisible()
  await page.goto('/requests/missing-record')
  await expect(page.getByRole('alert')).toContainText(
    /This record no longer exists/,
  )
  await navigate(page, 'Requests')
  await expect(
    page.getByRole('link', { name: /Office equipment/ }).first(),
  ).toBeVisible()
  await page.goto('/unknown-page')
  await expect(page.getByText('Page not found', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Go to the start page' }).click()
  await expect(
    page.getByRole('heading', { name: 'Requests', exact: true }),
  ).toBeVisible()
})

test('search text follows browser back and forward navigation', async ({
  page,
}) => {
  await page.goto('/requests?q=Office')
  const search = page.getByRole('searchbox', { name: 'Search requests' })
  await search.fill('Team')
  await search.press('Enter')
  await expect(page).toHaveURL(/q=Team/)
  await expect(
    page.getByRole('link', { name: /Team training/ }).first(),
  ).toBeVisible()
  await page.goBack()
  await expect(search).toHaveValue('Office')
  await expect(
    page.getByRole('link', { name: /Office equipment/ }).first(),
  ).toBeVisible()
  await page.goForward()
  await expect(search).toHaveValue('Team')
})

test('table filters, sorting, page size and cross-page bulk approval', async ({
  page,
}) => {
  await page.goto('/requests')
  await page.getByRole('tab', { name: /Pending/ }).click()
  await expect(page).toHaveURL(/status=/)
  await page.getByRole('button', { name: /^Filters/ }).click()
  await page.getByRole('checkbox', { name: /Equipment/ }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page).toHaveURL(/category=/)
  const rows = page.locator('[data-slot="data-table"] tbody tr')
  await expect(rows.first()).toContainText('Equipment')
  // The title column is pinned by default, so its name ends with ", pinned".
  await page.getByRole('button', { name: /^Request\s*(, pinned)?$/ }).click()
  await page.getByRole('menuitem', { name: 'Sort ascending' }).click()
  await expect(page).toHaveURL(/sort=title/)
  await page.getByRole('button', { name: 'Clear all' }).click()
  await expect(page).not.toHaveURL(/category=/)
  await page.getByLabel('Rows per page').click()
  await page.getByRole('option', { name: '20' }).click()
  await expect(rows).toHaveCount(20)
  await page.getByRole('tab', { name: /Pending/ }).click()
  await expect(rows.first()).toContainText('Pending')
  await expect(
    page.getByRole('checkbox', { name: 'Select row' }).first(),
  ).toBeEnabled()
  await page.getByRole('checkbox', { name: 'Select all on this page' }).click()
  const selectAll = page.getByRole('button', {
    name: /Select all \d+ matching/,
  })
  if (await selectAll.isVisible()) await selectAll.click()
  await page
    .getByRole('region', { name: 'Bulk actions' })
    .getByRole('button', { name: 'Approve' })
    .click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: /^Approve \d+ requests?$/ })
    .click()
  await expect(page.getByText(/requests? updated\./)).toBeVisible()
  await expect(
    page.getByText('No matching records', { exact: true }),
  ).toBeVisible()
})

test('reports: date range, drill-down and Excel export', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/reports')
  await expect(
    page.getByText('Requests created', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Last 90 days/ }).click()
  await page.getByRole('button', { name: 'Last 12 months' }).click()
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page).toHaveURL(/preset=12m/)
  await expect(page.locator('.recharts-surface').first()).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  await page.getByRole('menuitem', { name: /Excel/ }).click()
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/)
  await page
    .locator('[data-slot="data-table"] tbody tr', { hasText: 'Equipment' })
    .click()
  await expect(page).toHaveURL(/\/requests\?.*category=/)
  await expect(page.getByText('Created:', { exact: false })).toBeVisible()
  expect(errors).toEqual([])
})

test('design system grid and command palette', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/design-system?tab=patterns')
  await expect(page.getByText(/10,000 rows/)).toBeVisible()
  await page.getByLabel('Group by').click()
  await page.getByRole('option', { name: 'Region' }).click()
  await expect(
    page.getByRole('button', { name: /North \(\d+\)/ }),
  ).toBeVisible()
  // Phones have no shortcut; the header search button opens the same palette.
  if ((page.viewportSize()?.width ?? 1280) < 768)
    await page.getByRole('button', { name: 'Search or jump to…' }).click()
  else await page.keyboard.press('ControlOrMeta+k')
  await page.getByPlaceholder('Type a page or action…').fill('Reports')
  await page.getByRole('option', { name: 'Reports' }).click()
  await expect(page).toHaveURL(/\/reports/)
  expect(errors).toEqual([])
})

test('owner search, column pinning and stable scroll on in-page changes', async ({
  page,
}) => {
  await page.goto('/requests')
  await page.getByRole('button', { name: /^Filters/ }).click()
  await page.getByRole('searchbox', { name: /Search Owner/ }).fill('karim')
  await page.getByRole('checkbox', { name: /Karim Mansour/ }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('list', { name: 'Filters' })).toContainText(
    'Karim Mansour',
  )
  // Phones show pinned columns over the scrolled area; pinning is a wider-screen task.
  if ((page.viewportSize()?.width ?? 1280) >= 768) {
    await page.getByRole('button', { name: 'Owner', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Pin to start' }).click()
    await expect(
      page.getByRole('button', { name: /^Owner\s*, pinned/ }),
    ).toBeVisible()
  }
  await page.goto('/reports')
  await page
    .getByRole('tab', { name: 'Owner', exact: true })
    .scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  expect(before).toBeGreaterThan(0)
  await page.getByRole('tab', { name: 'Owner', exact: true }).click()
  await expect(page).toHaveURL(/breakdown=owner/)
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(before / 2)
})
