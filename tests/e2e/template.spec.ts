import { expect, test, type Page } from '@playwright/test'
import { compositionViews } from '../../src/modules/compositions/views'

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

test('design system grid, compositions and command palette', async ({
  page,
}) => {
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
  await page.goto('/compositions?view=line-items')
  await page.getByRole('button', { name: 'Add line' }).click()
  await expect(page.getByLabel('Item 4')).toBeFocused()
  await expect(page.getByText('Grand total')).toBeVisible()
  // Undo and redo step through committed edits.
  const first = page.getByLabel('Item 1')
  await first.fill('Laptop 16"')
  await first.press('Tab')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(first).toHaveValue('Laptop 14"')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(page.getByLabel('Item 1')).toHaveValue('Laptop 16"')
  // Phones have no shortcut; the header search button opens the same palette.
  if ((page.viewportSize()?.width ?? 1280) < 768)
    await page.getByRole('button', { name: 'Search', exact: true }).click()
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

test.describe('compositions', () => {
  test('conditional form validates visible fields and repeatable contacts', async ({
    page,
  }) => {
    await page.goto('/compositions?view=conditional-form')
    await page.getByLabel('Company name', { exact: true }).fill('Acme Supplies')
    await page.getByRole('button', { name: 'Submit vendor' }).click()
    await expect(
      page.getByLabel('Commercial registration', { exact: true }),
    ).toHaveAttribute('aria-invalid', 'true')
    await page.getByRole('radio', { name: 'Individual' }).click()
    await expect(
      page.getByLabel('Commercial registration', { exact: true }),
    ).toHaveCount(0)
    await choose(page, 'Payment method', 'Cheque')
    await expect(page.getByLabel('IBAN', { exact: true })).toHaveCount(0)
    await page.getByLabel('Name', { exact: true }).fill('Alex Morgan')
    await page.getByLabel('Email', { exact: true }).fill('alex@example.com')
    await page.getByLabel('Role', { exact: true }).fill('Buyer')
    await page.getByRole('button', { name: 'Add contact' }).click()
    await expect(page.getByLabel('Name', { exact: true })).toHaveCount(2)
    await page.getByRole('button', { name: 'Submit vendor' }).click()
    await expect(
      page.getByLabel('Name', { exact: true }).nth(1),
    ).toHaveAttribute('aria-invalid', 'true')
    await page.getByRole('button', { name: 'Remove contact 2' }).click()
    await page.getByRole('button', { name: 'Submit vendor' }).click()
    await expect(page.getByText('Vendor submitted for review.')).toBeVisible()
    await expect(page.getByLabel('Company name', { exact: true })).toHaveValue(
      '',
    )
  })

  test('every composition renders without errors or page overflow', async ({
    page,
  }) => {
    // One sweep over every registered route; allow time proportional to their number.
    test.setTimeout(compositionViews.length * 4_000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const view of compositionViews) {
      await page.goto(`/compositions?view=${view}`)
      await expect(page.locator(`[data-composition="${view}"]`)).toBeVisible()
      await expect(
        page.locator('.animate-page-in [data-slot=skeleton]'),
      ).toHaveCount(0)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, view).toBeLessThanOrEqual(0)
    }
    expect(errors).toEqual([])
  })

  test('triage keyboard, kanban move menu and inline table save', async ({
    page,
  }) => {
    await page.goto('/compositions?view=triage')
    await expect(page.getByText('0 of 5 cleared')).toBeVisible()
    await page.keyboard.press('j')
    await page.keyboard.press('a')
    await expect(page.getByText('REQ-1239 approved.')).toBeVisible()
    await expect(page.getByText('1 of 5 cleared')).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText('0 of 5 cleared')).toBeVisible()

    await page.goto('/compositions?view=kanban')
    await page
      .getByRole('button', { name: 'Move to: Office equipment' })
      .click()
    await page.getByRole('menuitem', { name: 'Done' }).click()
    await expect(page.getByText('REQ-1240 moved to Done.')).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Done' }).getByText('Office equipment'),
    ).toBeVisible()

    await page.goto('/compositions?view=inline-table')
    const price = page.getByLabel('Price: Barcode scanner')
    await price.fill('199.00')
    await expect(page.getByText('1 row changed')).toBeVisible()
    await price.fill('0')
    await expect(page.getByText('Fix 1 cell')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Save changes' }),
    ).toBeDisabled()
    await price.fill('199.00')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('1 row saved.')).toBeVisible()
    await expect(page.getByText('No unsaved changes')).toBeVisible()
  })

  test('reconciliation, import mapping and bulk edit change real state', async ({
    page,
  }) => {
    await page.goto('/compositions?view=reconciliation')
    await page.getByRole('button', { name: 'Accept 3 exact matches' }).click()
    await expect(
      page.getByText('3 of 7 statement lines reconciled'),
    ).toBeVisible()
    // One bank payment split over two statement lines matches one book entry.
    await page.getByRole('checkbox', { name: /CONTOSO OFFICE 2 OF 2/ }).click()
    await page.getByRole('checkbox', { name: /CONTOSO OFFICE 1 OF 2/ }).click()
    await expect(
      page.getByRole('button', { name: 'Match', exact: true }),
    ).toBeDisabled()
    await page
      .getByRole('checkbox', { name: /Payment PO-2038 Contoso/ })
      .click()
    await page.getByRole('button', { name: 'Match', exact: true }).click()
    await expect(
      page.getByText('5 of 7 statement lines reconciled'),
    ).toBeVisible()

    await page.goto('/compositions?view=import-mapping')
    await expect(
      page.getByText('Map every required field to continue.'),
    ).toBeVisible()
    await choose(page, 'Field for column Terms (days)', 'Payment terms')
    await choose(page, 'Field for column Region', 'Country')
    await choose(page, 'Field for column Internal note', 'Do not import')
    await expect(page.getByText('3 rows have errors')).toBeVisible()
    await page.getByRole('button', { name: 'Import 99 rows' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Import 99 rows' })
      .click()
    await expect(
      page.getByText(
        'Importing 99 rows. You will be notified when it finishes.',
      ),
    ).toBeVisible()

    await page.goto('/compositions?view=bulk-edit')
    await choose(page, 'Priority', 'High')
    await expect(
      page.getByText('Priority becomes High on 2 records'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Apply to 2 records' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Apply to 2 records' })
      .click()
    await expect(page.getByText('2 records updated.')).toBeVisible()
  })

  test('approval route and permission matrix respond to decisions', async ({
    page,
  }) => {
    await page.goto('/compositions?view=approval-chain')
    await expect(page.getByText(/Not needed below \$100,000/)).toBeVisible()
    await page.getByRole('radio', { name: '$120,000.00' }).click()
    await expect(page.getByText(/Not needed below/)).toHaveCount(0)
    await page.getByRole('button', { name: 'Remind' }).click()
    await expect(page.getByText('Reminder sent to Priya Nair.')).toBeVisible()
    await page.getByRole('button', { name: 'Reassign' }).click()
    await page.getByRole('menuitem', { name: 'Lina Farouk' }).click()
    await expect(
      page.getByText('Step reassigned to Lina Farouk.'),
    ).toBeVisible()

    await page.goto('/compositions?view=permission-matrix')
    await page
      .getByRole('checkbox', { name: 'Viewer: Requests: Export' })
      .click()
    await expect(page.getByText('1 unsaved change')).toBeVisible()
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(
      page.getByRole('alertdialog', { name: 'Save 1 permission change?' }),
    ).toBeVisible()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Save changes' })
      .click()
    await expect(page.getByText('Permissions saved.')).toBeVisible()
    await expect(page.getByText('No unsaved changes')).toBeVisible()
  })

  test('record pages advance state from their header actions', async ({
    page,
  }) => {
    await page.goto('/compositions?view=record-tabs')
    const lifecycle = page.getByRole('list', { name: 'Order lifecycle' })
    await expect(lifecycle.locator('[aria-current=step]')).toContainText(
      'Approval',
    )
    await page.getByRole('button', { name: 'Approve order' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Approve order' })
      .click()
    await expect(lifecycle.locator('[aria-current=step]')).toContainText(
      'Sent to supplier',
    )
    await page.getByRole('button', { name: 'Record receipt' }).click()
    await expect(
      page.getByText('Receipt GRN-0881 recorded for PO-2041.'),
    ).toBeVisible()
    await page.getByRole('tab', { name: /History/ }).click()
    await page.getByLabel('Add a comment').fill('Received in full.')
    await page.getByRole('button', { name: 'Comment', exact: true }).click()
    await expect(page.getByText('Received in full.')).toBeVisible()

    await page.goto('/compositions?view=three-way-match')
    const release = page.getByRole('button', { name: /^Release / })
    await expect(release).toBeDisabled()
    await choose(page, 'Standing desk', 'Pay for received quantity')
    await choose(page, 'Monitor arm', 'Pay at order price')
    await expect(release).toHaveText('Release $7,970.00')
    await release.click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Release $7,970.00' })
      .click()
    await expect(page.getByText('Released for payment')).toBeVisible()

    await page.goto('/compositions?view=customer-360')
    await page.getByRole('button', { name: 'Log activity' }).click()
    await page.getByRole('menuitem', { name: 'Call' }).click()
    await expect(page.getByText('Call logged on the account.')).toBeVisible()
    await page.getByRole('button', { name: 'Place credit hold' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Place credit hold' })
      .click()
    await expect(
      page.getByRole('button', { name: 'Release credit hold' }),
    ).toBeVisible()
  })
})
