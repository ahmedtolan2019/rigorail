import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useServices } from '@/shared/api/services'
import '@/shared/i18n'
import { Bootstrap } from './bootstrap'
const state = vi.hoisted(() => ({ status: 200, workspace: 'north' }))
vi.mock('./runtime', async () => {
  const { ApiClient } = await import('@/shared/api/client')
  return {
    permissionCatalog: [],
    createRuntime: async () => ({
      mode: 'api',
      aiEnabled: false,
      api: new ApiClient('https://example.test', async () =>
        state.status === 200
          ? Response.json({
              user: { id: 'a', name: 'A' },
              workspace: { id: state.workspace, name: state.workspace },
              revision: '1',
              grants: [],
            })
          : Response.json({ message: 'Unavailable' }, { status: state.status }),
      ),
    }),
  }
})
vi.mock('./router', () => ({ router: {} }))
vi.mock('@tanstack/react-router', () => ({
  RouterProvider: () => <Workspace />,
  Link: () => null,
}))
function Workspace() {
  const services = useServices()
  return (
    <>
      <input aria-label="Draft" defaultValue="" />
      <button onClick={() => void services.refreshSession()}>
        Refresh session
      </button>
      <p>{services.session.workspace.id}</p>
    </>
  )
}
test('a transient session error preserves hidden drafts; an authorization failure clears them', async () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  state.status = 200
  render(<Bootstrap />)
  fireEvent.change(await screen.findByLabelText('Draft'), {
    target: { value: 'Keep this draft' },
  })
  state.status = 503
  fireEvent.click(screen.getByRole('button', { name: 'Refresh session' }))
  await screen.findByRole('button', { name: 'Try again' })
  expect(screen.getByLabelText('Draft')).not.toBeVisible()
  state.status = 200
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await waitFor(() => expect(screen.getByLabelText('Draft')).toBeVisible())
  expect(screen.getByLabelText('Draft')).toHaveValue('Keep this draft')
  state.status = 401
  fireEvent.click(screen.getByRole('button', { name: 'Refresh session' }))
  await screen.findByRole('button', { name: 'Try again' })
  expect(screen.queryByLabelText('Draft')).not.toBeInTheDocument()
})
