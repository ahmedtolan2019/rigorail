import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
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
vi.mock('./router', () => ({ router: { history: { replace: vi.fn() } } }))
vi.mock('@/modules/account/public', () => ({
  signOutRequest: async () => {
    state.status = 401
  },
  SignedOutApp: ({
    reason,
    onSignedIn,
  }: {
    reason?: string
    onSignedIn: (returnTo: string) => Promise<void>
  }) => (
    <>
      <p>Signed out: {reason ?? 'none'}</p>
      <button
        onClick={() => {
          state.status = 200
          void onSignedIn('/')
        }}
      >
        Sign in
      </button>
    </>
  ),
}))
vi.mock('@tanstack/react-router', () => ({
  RouterProvider: () => <Workspace />,
  Link: () => null,
}))
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
})
function Workspace() {
  const services = useServices()
  return (
    <>
      <input aria-label="Draft" defaultValue="" />
      <button onClick={() => void services.refreshSession()}>
        Refresh session
      </button>
      <button onClick={() => void services.signOut()}>Sign out</button>
      <p>{services.session.workspace.id}</p>
    </>
  )
}
test('a transient session error preserves hidden drafts; an authorization failure clears them', async () => {
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
  await screen.findByText('Signed out: expired')
  expect(screen.queryByLabelText('Draft')).not.toBeInTheDocument()
})

test('signing in starts a fresh workspace; signing out returns to sign-in', async () => {
  state.status = 401
  render(<Bootstrap />)
  await screen.findByText('Signed out: none')
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  fireEvent.change(await screen.findByLabelText('Draft'), {
    target: { value: 'Unsaved' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  await screen.findByText('Signed out: signed-out')
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByLabelText('Draft')).toHaveValue('')
})
