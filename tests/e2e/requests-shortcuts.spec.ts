import { expect, test } from '@playwright/test'

test('keyboard shortcuts: help lists page and global keys, / searches, n creates', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Hardware keyboard shortcuts.')
  await page.goto('/requests')
  await expect(page.getByRole('heading', { name: 'Requests' })).toBeVisible()
  await page.keyboard.press('Shift+?')
  const help = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  await expect(help.getByText('Search or jump to')).toBeVisible()
  await expect(help.getByText('Search requests')).toBeVisible()
  await expect(help.getByText('New request')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.keyboard.press('/')
  const search = page.getByRole('searchbox', { name: 'Search requests' })
  await expect(search).toBeFocused()
  // Single-key shortcuts never fire while typing.
  await page.keyboard.type('n')
  await expect(page).toHaveURL(/\/requests(\?.*)?$/)
  await search.fill('')
  await search.blur()
  await page.keyboard.press('n')
  await expect(page).toHaveURL(/\/requests\/new/)
})
