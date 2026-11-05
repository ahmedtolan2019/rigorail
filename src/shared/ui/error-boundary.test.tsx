import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import '../i18n'
import { AppErrorBoundary } from './error-boundary'
test('contains an unexpected render failure and supports deliberate retry', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  let fail = true
  function Screen() {
    if (fail) throw new Error('Internal exception')
    return <h1>Recovered screen</h1>
  }
  const report = vi.fn()
  render(
    <AppErrorBoundary onError={report}>
      <Screen />
    </AppErrorBoundary>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent(
    'The application could not display this screen',
  )
  expect(screen.queryByText('Internal exception')).not.toBeInTheDocument()
  expect(report).toHaveBeenCalled()
  fail = false
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(
    screen.getByRole('heading', { name: 'Recovered screen' }),
  ).toBeVisible()
})
