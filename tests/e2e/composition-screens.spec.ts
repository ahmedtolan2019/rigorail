import { expect, test, type Page } from '@playwright/test'
import { compositionViews } from '../../src/modules/compositions/views'

// Compositions-owned browser coverage. Removing the module removes this file.

/** Picks an option in a Radix Select identified by its label. */
async function choose(page: Page, label: string, option: string | RegExp) {
  await page.getByLabel(label, { exact: true }).click()
  await page.getByRole('option', { name: option }).click()
  await expect(page.getByLabel(label, { exact: true })).toContainText(option)
}

test('editable line items add rows with focus and undo or redo edits', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
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
  expect(errors).toEqual([])
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
