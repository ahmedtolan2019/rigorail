import { expect, test } from '@playwright/test'

test('saved views apply, save, restore defaults and delete with undo', async ({
  page,
}) => {
  await page.goto('/requests')
  const trigger = page.getByRole('button', { name: /^Saved views:/ })
  await expect(trigger).toHaveAccessibleName('Saved views: All requests')

  await trigger.click()
  await page.getByRole('menuitem', { name: 'Waiting for approval' }).click()
  await expect(page.getByRole('tab', { name: /Pending/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(trigger).toHaveAccessibleName(
    'Saved views: Waiting for approval',
  )

  // Any change makes it a custom view that can be saved under a new name.
  await page.getByRole('tab', { name: /Draft/ }).click()
  await expect(trigger).toHaveAccessibleName('Saved views: Custom view')
  await trigger.click()
  await page.getByRole('menuitem', { name: 'Save current view…' }).click()
  const dialog = page.getByRole('dialog', { name: 'Save view' })
  await dialog.getByRole('button', { name: 'Save view' }).click()
  await expect(dialog.getByText('Use 2 to 60 characters.')).toBeVisible()
  await dialog.getByLabel('View name').fill('My drafts')
  await dialog.getByRole('button', { name: 'Save view' }).click()
  await expect(page.getByText('View “My drafts” saved.')).toBeVisible()
  await expect(trigger).toHaveAccessibleName('Saved views: My drafts')

  await trigger.click()
  await page.getByRole('menuitem', { name: 'All requests' }).click()
  await expect(page.getByRole('tab', { name: /^All/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(trigger).toHaveAccessibleName('Saved views: All requests')

  await trigger.click()
  await page.getByRole('button', { name: 'Delete view My drafts' }).click()
  await page.getByRole('button', { name: 'Undo' }).click()
  await trigger.click()
  await expect(page.getByRole('menuitem', { name: 'My drafts' })).toBeVisible()
})
