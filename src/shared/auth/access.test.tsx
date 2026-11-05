import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, test, vi } from 'vitest'
import type { Decision } from './model'
import '../i18n'
import { AccessBoundary } from './access'
const mock = vi.hoisted(() => ({ decision: { status: 'allowed' } as Decision }))
vi.mock('../capabilities/hooks', () => ({ useCapability: () => mock.decision }))

test('temporary capability errors hide actions without discarding an existing draft; denial clears it', () => {
  const client = new QueryClient()
  function Screen() {
    return (
      <QueryClientProvider client={client}>
        <AccessBoundary action="edit">
          <input aria-label="Draft" defaultValue="" />
        </AccessBoundary>
      </QueryClientProvider>
    )
  }
  const view = render(<Screen />)
  fireEvent.change(screen.getByLabelText('Draft'), {
    target: { value: 'Keep this draft' },
  })
  mock.decision = { status: 'error', reason: 'unavailable' }
  view.rerender(<Screen />)
  expect(screen.getByLabelText('Draft')).not.toBeVisible()
  mock.decision = { status: 'allowed' }
  view.rerender(<Screen />)
  expect(screen.getByLabelText('Draft')).toHaveValue('Keep this draft')
  mock.decision = { status: 'denied', reason: 'deniedHint' }
  view.rerender(<Screen />)
  expect(screen.queryByLabelText('Draft')).not.toBeInTheDocument()
  view.unmount()
  client.clear()
})
