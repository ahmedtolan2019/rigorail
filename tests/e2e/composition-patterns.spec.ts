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

/** Toasts render in a portal outside the composition. */
async function toastSays(page: Page, text: string) {
  await expect(
    page.locator('[data-sonner-toaster]').getByText(text, { exact: true }),
  ).toBeVisible()
}
/** Picks an option in a Radix Select identified by its accessible name. */
async function pick(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

test.describe('workspace compositions', () => {
  test('global search filters, highlights and opens with the keyboard', async ({
    page,
  }) => {
    await page.goto('/compositions?view=global-search')
    const box = page.getByRole('combobox', {
      name: 'Search records, people and documents',
    })
    await expect(page.locator('[data-composition] mark').first()).toHaveText(
      /north/i,
    )
    await box.focus()
    await box.press('ArrowDown')
    await box.press('Enter')
    await toastSays(page, 'Opening INV-3301.')
    await page.getByRole('button', { name: /^People/ }).click()
    await expect(page.getByRole('option')).toHaveCount(2)
    await box.fill('zzz')
    await expect(page.getByText('Nothing matches "zzz"')).toBeVisible()
    await box.press('Escape')
    await expect(page.getByText('Recent searches')).toBeVisible()
  })

  test('comment threads support mentions, editing and resolving', async ({
    page,
  }) => {
    await page.goto('/compositions?view=comments-thread')
    const composer = page.getByRole('textbox', {
      name: 'Write a comment. Type @ to mention someone.',
    })
    await composer.fill('Please check @Om')
    await expect(
      page.getByRole('option', { name: /Omar Haddad/ }),
    ).toBeVisible()
    await composer.press('Enter')
    await expect(composer).toHaveValue('Please check @Omar Haddad ')
    await expect(page.getByText('Omar Haddad will be notified.')).toBeVisible()
    await page.getByRole('button', { name: 'Comment', exact: true }).click()
    await expect(
      page
        .locator('[data-composition]')
        .getByText('Please check', { exact: false })
        .first(),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Comment actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()
    const editor = page
      .getByRole('textbox', {
        name: 'Write a comment. Type @ to mention someone.',
      })
      .nth(1)
    await editor.fill('Updated note')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText('Updated note')).toBeVisible()
    await expect(page.getByText(/· edited/)).toBeVisible()
    await page.getByRole('button', { name: 'Resolve' }).first().click()
    await expect(
      page.getByRole('button', { name: 'Show 2 resolved threads' }),
    ).toBeVisible()
  })

  test('notification preferences preview volume and save', async ({ page }) => {
    await page.goto('/compositions?view=notifications-center')
    await expect(
      page.getByRole('checkbox', {
        name: 'An approval I own is escalated: In app',
      }),
    ).toBeDisabled()
    await expect(page.getByText('About 20 emails a week')).toBeVisible()
    await page
      .getByRole('checkbox', { name: 'Someone mentions me: Email' })
      .click()
    await expect(page.getByText('1 unsaved change')).toBeVisible()
    await expect(page.getByText('About 14 emails a week')).toBeVisible()
    await page.getByRole('button', { name: 'Save changes' }).click()
    await toastSays(page, 'Notification preferences saved.')
    await expect(page.getByText('No unsaved changes')).toBeVisible()
  })

  test('audit log filters, shows diffs and exports the filtered events', async ({
    page,
  }) => {
    await page.goto('/compositions?view=audit-log')
    await expect(page.getByText('Jeddah Distribution Centre')).toBeVisible()
    await pick(page, 'Action', 'Changed access')
    await expect(page.getByText('1 event', { exact: true })).toBeVisible()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export CSV' }).click()
    expect((await download).suggestedFilename()).toBe('audit-log.csv')
    expect(await downloadedText(await download)).toContain('EV-90230')
    await page.getByLabel('Search object or reference').fill('zzz')
    await expect(page.getByText('No events match these filters')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByText('8 events', { exact: true })).toBeVisible()
  })

  test('report builder previews, advises and saves a report', async ({
    page,
  }) => {
    await page.goto('/compositions?view=report-builder')
    await pick(page, 'Group by', 'Month')
    await page.getByRole('radio', { name: 'Pie chart' }).click()
    await expect(
      page.getByText(/Pie charts compare a few parts of a whole/),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Save report' }).click()
    await expect(page.getByText('Name the report to save it.')).toBeVisible()
    await page.getByLabel('Report name').fill('Monthly spend')
    await page.getByRole('button', { name: 'Save report' }).click()
    await toastSays(page, '"Monthly spend" saved.')
    await page.reload()
    await expect(
      page.getByRole('button', { name: 'Monthly spend', exact: true }),
    ).toBeVisible()
  })

  test('dashboard widgets reorder by keyboard, persist and reset', async ({
    page,
  }) => {
    await page.goto('/compositions?view=custom-dashboard')
    await page.getByRole('button', { name: 'Customise' }).click()
    await page
      .getByRole('button', { name: 'Move Spend this month later' })
      .click()
    await expect(
      page.getByText('Spend this month moved to position 2 of 5.'),
    ).toBeAttached()
    await page.getByRole('button', { name: 'Remove Waiting for me' }).click()
    await page.reload()
    await page.getByRole('button', { name: 'Customise' }).click()
    await expect(
      page.getByRole('button', { name: 'Remove Waiting for me' }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'Add widget' }).click()
    await page.getByRole('menuitem', { name: 'Top suppliers' }).click()
    await expect(
      page.getByRole('button', { name: 'Remove Top suppliers' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Reset layout' }).click()
    await expect(
      page.getByRole('button', { name: 'Remove Waiting for me' }),
    ).toBeVisible()
  })

  test('approval rules validate and route a test request', async ({ page }) => {
    await page.goto('/compositions?view=rules-editor')
    await expect(page.getByText('Matched rule 2: Large spend')).toBeVisible()
    await page.getByLabel('Amount', { exact: true }).fill('60000')
    await expect(page.getByText('Matched rule 1: Large software')).toBeVisible()
    await page.getByLabel('Rule name 2').fill('')
    await expect(page.getByText('Name the rule.')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Publish rules' }),
    ).toBeDisabled()
    await page.getByLabel('Rule name 2').fill('Large spend')
    await page.getByRole('button', { name: 'Move rule 3 up' }).click()
    await expect(page.getByText('All rules are valid.')).toBeVisible()
    await page.getByRole('button', { name: 'Publish rules' }).click()
    await confirm(page, 'Publish rules')
    await toastSays(page, 'Approval rules published.')
  })
})
