import { expect, test } from '@playwright/test'

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
  await page.getByRole('button', { name: 'Submit for approval' }).click()
  await expect(
    page.getByText('Request submitted for approval.', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Approve request' }).click()
  await expect(
    page.getByText('Request approved.', { exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('preserves filters on detail return and protects unsaved edits', async ({
  page,
}) => {
  await page.goto('/requests?q=Office&status=draft&page=1&sort=title')
  await page.getByRole('link', { name: /Office equipment/ }).click()
  await page.getByRole('link', { name: 'Back to requests' }).click()
  await expect(
    page.getByRole('textbox', { name: 'Search requests' }),
  ).toHaveValue('Office')
  await page.getByRole('link', { name: 'New request', exact: true }).click()
  await page.getByLabel('Request', { exact: true }).fill('Unsaved draft')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('link', { name: 'Cancel', exact: true }).click()
  await expect(page.getByLabel('Request', { exact: true })).toHaveValue(
    'Unsaved draft',
  )
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('link', { name: 'Cancel', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Requests', exact: true }),
  ).toBeVisible()
})

test('enforces persona, quotas, subscription and flags across navigation', async ({
  page,
}) => {
  await page.goto('/access')
  await page.getByLabel('Demo persona').selectOption('viewer')
  await expect(page.getByLabel('Demo persona')).toHaveValue('viewer')
  await page.getByRole('link', { name: 'Requests', exact: true }).click()
  await expect(page.getByRole('button', { name: 'New request' })).toBeDisabled()
  await page.getByRole('link', { name: 'Access', exact: true }).click()
  await page.getByLabel('Demo persona').selectOption('manager')
  await expect(page.getByLabel('Demo persona')).toHaveValue('manager')
  await page
    .getByLabel('Subscription and usage', { exact: true })
    .selectOption('starter')
  await expect(
    page.getByLabel('Subscription and usage', { exact: true }),
  ).toHaveValue('starter')
  await page.getByRole('link', { name: 'Requests', exact: true }).click()
  await expect(
    page.getByText('Your workspace has reached its usage limit.'),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Access', exact: true }).click()
  await page
    .getByLabel('Subscription and usage', { exact: true })
    .selectOption('none')
  await expect(
    page.getByLabel('Subscription and usage', { exact: true }),
  ).toHaveValue('none')
  await expect(
    page.getByRole('link', { name: 'Requests', exact: true }),
  ).toHaveCount(0)
  // Brand remains a route to the module; direct route access is still denied.
  await page.getByRole('link', { name: 'Foundation', exact: true }).click()
  await expect(
    page.getByText(
      'Your workspace subscription does not include this feature.',
    ),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Access', exact: true }).click()
  await page
    .getByLabel('Subscription and usage', { exact: true })
    .selectOption('pro')
  await expect(
    page.getByLabel('Subscription and usage', { exact: true }),
  ).toHaveValue('pro')
  await page.getByLabel('Requests feature flag').selectOption('false')
  await expect(page.getByLabel('Requests feature flag')).toHaveValue('false')
  await page.getByRole('link', { name: 'Foundation', exact: true }).click()
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
    page.getByRole('link', { name: /Office equipment/ }),
  ).toBeVisible()
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-english.png`,
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
    .boundingBox()
  const tableViewport = await page.locator('.data-table').boundingBox()
  expect(firstRecord!.x).toBeGreaterThanOrEqual(tableViewport!.x)
  expect(firstRecord!.x + firstRecord!.width).toBeLessThanOrEqual(
    tableViewport!.x + tableViewport!.width,
  )
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-arabic.png`,
    fullPage: true,
  })
  await page.getByRole('link', { name: 'طلب جديد', exact: true }).click()
  await page.getByLabel('الطلب', { exact: true }).fill('معدات الموقع')
  await page.getByLabel('المبلغ', { exact: true }).fill('١٢٣٫٥٠')
  await page.getByRole('button', { name: 'حفظ المسودة' }).click()
  await expect(
    page.getByRole('heading', { name: 'معدات الموقع' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'المظهر', exact: true }).click()
  await page.getByLabel('السمة', { exact: true }).selectOption('dark')
  await page.getByLabel('تخطيط التنقل', { exact: true }).selectOption('topbar')
  await expect(page.locator('html')).toHaveClass('dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('[data-shell]')).toHaveAttribute(
    'data-shell',
    'topbar',
  )
  await page.getByRole('link', { name: 'المكونات', exact: true }).click()
  await page.getByRole('textbox', { name: 'ابحث عن مكون' }).fill('calendar')
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
  await page.getByLabel('Theme', { exact: true }).selectOption('dark')
  await expect(page.locator('html')).toHaveClass('dark')
  await page.getByRole('button', { name: 'العربية', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('workspace switch replaces cached records and business limits', async ({
  page,
}) => {
  await page.goto('/requests')
  await expect(
    page.getByRole('link', { name: /Office equipment/ }),
  ).toHaveAttribute('href', /north-1/)
  await page.getByRole('link', { name: 'Access', exact: true }).click()
  await page.getByLabel('Active workspace').selectOption('south')
  await expect(page.getByLabel('Active workspace')).toHaveValue('south')
  await expect(
    page.getByText('Workspace limit: $2,500.00', { exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Requests', exact: true }).click()
  await expect(
    page.getByRole('link', { name: /Office equipment/ }),
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
    page.getByText('No matching requests', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Reset filters' }).click()
  await expect(
    page.getByRole('link', { name: /Office equipment/ }),
  ).toBeVisible()
  await page.goto('/requests/missing-record')
  await expect(page.getByRole('alert')).toHaveText(
    /This record no longer exists/,
  )
  await page.getByRole('link', { name: 'Requests', exact: true }).click()
  await expect(
    page.getByRole('link', { name: /Office equipment/ }),
  ).toBeVisible()
  await page.goto('/unknown-page')
  await expect(page.getByText('Page not found', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Go to requests' }).click()
  await expect(
    page.getByRole('heading', { name: 'Requests', exact: true }),
  ).toBeVisible()
})

test('search text follows browser back and forward navigation', async ({
  page,
}) => {
  await page.goto('/requests?q=Office')
  const search = page.getByRole('textbox', { name: 'Search requests' })
  await search.fill('Team')
  await page
    .getByRole('button', { name: 'Search requests', exact: true })
    .click()
  await expect(page.getByRole('link', { name: /Team training/ })).toBeVisible()
  await page.goBack()
  await expect(search).toHaveValue('Office')
  await expect(
    page.getByRole('link', { name: /Office equipment/ }),
  ).toBeVisible()
  await page.goForward()
  await expect(search).toHaveValue('Team')
})
