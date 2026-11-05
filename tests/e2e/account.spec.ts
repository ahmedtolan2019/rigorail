import { expect, test, type Page } from '@playwright/test'

// Demo identity values from src/app/demo/identity.ts.
const DEMO_PASSWORD = 'demo-password-1'
const DEMO_CODE = '123456'

async function signOutFromAccount(page: Page) {
  await page.goto('/account')
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Sign out', exact: true })
    .click()
  await expect(page).toHaveURL(/\/sign-in$/)
  await expect(page.getByText('You have signed out.')).toBeVisible()
}

test('sign out, deep link, two-step sign-in and return to the page', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await signOutFromAccount(page)
  await expect(page).toHaveTitle(/^Sign in · /)

  // Wrong password: translated error, password cleared, email kept.
  await page.getByLabel('Work email').fill('sam@example.com')
  await page.getByLabel('Password', { exact: true }).fill('wrong password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Email or password is incorrect.',
  )
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')

  // A protected deep link while signed out keeps its destination.
  await page.goto('/reports')
  await expect(page).toHaveURL(/\/sign-in\?redirect=%2Freports$/)
  await page.getByLabel('Work email').fill('sam+mfa@example.com')
  await page.getByLabel('Password', { exact: true }).fill(DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Two-step verification' }),
  ).toBeVisible()
  await page.getByLabel('Verification code').fill(DEMO_CODE)
  await expect(page).toHaveURL(/\/reports/)
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
  expect(errors).toEqual([])
})

test('forgot and reset password, then sign in with the new password', async ({
  page,
}) => {
  await signOutFromAccount(page)
  await page.getByLabel('Work email').fill('sam@example.com')
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await expect(page).toHaveURL(/\/forgot-password\?email=/)
  await expect(page.getByLabel('Work email')).toHaveValue('sam@example.com')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(
    page.getByRole('heading', { name: 'Check your email' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Open the demo reset link' }).click()
  const fresh = 'a brand new passphrase 7'
  await page.getByLabel('New password', { exact: true }).fill('short')
  await page.getByLabel('Confirm new password').fill('short')
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(
    page.getByText('The password doesn’t meet the requirements.'),
  ).toBeVisible()
  await page.getByLabel('New password', { exact: true }).fill(fresh)
  await page.getByLabel('Confirm new password').fill(fresh)
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(page).toHaveURL(/\/sign-in$/)
  await expect(page.getByText('Password updated.')).toBeVisible()
  await page.getByLabel('Work email').fill('sam@example.com')
  await page.getByLabel('Password', { exact: true }).fill(fresh)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.locator('[data-shell]')).toBeVisible()

  // An expired link offers a new one instead of a dead form.
  await signOutFromAccount(page)
  await page.goto('/reset-password?token=old')
  await page.getByLabel('New password', { exact: true }).fill(fresh)
  await page.getByLabel('Confirm new password').fill(fresh)
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(
    page.getByRole('heading', { name: 'This link has expired' }),
  ).toBeVisible()
})

test('account page: profile name, devices and the account menu', async ({
  page,
}) => {
  await page.goto('/account')
  const name = page.getByLabel('Name', { exact: true })
  await name.fill('Sam T. Taylor')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Profile updated.')).toBeVisible()
  await page.getByRole('button', { name: 'Sign out Safari on iPhone' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('Sign out Safari on iPhone?')
  await confirm.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByText('Safari on iPhone')).toHaveCount(0)
  await page.getByRole('button', { name: 'Sign out other devices' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Sign out 1 device' })
    .click()
  await expect(page.getByText('No other devices are signed in.')).toBeVisible()
  // A signed-in user opening a sign-in URL goes to the start page.
  await page.goto('/sign-in')
  await expect(page).toHaveURL(/\/requests/)
})
