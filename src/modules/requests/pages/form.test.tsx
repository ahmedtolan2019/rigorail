import type { ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, test, vi } from 'vitest'
import { ServicesContext, type Services } from '@/shared/api/services'
import { ApiClient } from '@/shared/api/client'
import '@/shared/i18n'
import { requestKeys } from '../queries'
import RequestForm from './form'
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ requestId: 'record-1' }),
  useNavigate: () => vi.fn(),
  getRouteApi: () => ({ useSearch: () => ({}) }),
  useBlocker: () => ({ status: 'idle' }),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}))
vi.mock('@/shared/auth/access', () => ({
  AccessBoundary: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('../ai-suggestion', () => ({ AiSuggestion: () => null }))

test('background record transitions retain the draft and prevent an invalid save', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  })
  const record = {
    id: 'record-1',
    title: 'Original title',
    description: 'Original description',
    amountMinor: 1250,
    status: 'draft',
    ownerId: 'a',
    ownerName: 'A',
    workspaceId: 'north',
    version: 1,
    updatedAt: '2026-11-05T00:00:00Z',
  }
  client.setQueryData(requestKeys.detail('north', 'record-1'), record)
  client.setQueryData(['configuration', 'a', 'north', '1'], {
    revision: '1',
    limits: { requestAmountMinor: 500000 },
    features: { aiSuggestions: false },
  })
  const services: Services = {
    api: new ApiClient('https://example.test'),
    session: {
      user: { id: 'a', name: 'A' },
      workspace: { id: 'north', name: 'North' },
      revision: '1',
      grants: [],
    },
    access: { decide: () => ({ status: 'allowed' }) },
    catalog: [],
    loadPermissionLabels: async () => undefined,
    mode: 'api',
    aiEnabled: false,
    refreshSession: async () => undefined,
    signOut: async () => undefined,
    upload: async () => {
      throw new Error('Uploads are not used here.')
    },
  }
  const view = render(
    <QueryClientProvider client={client}>
      <ServicesContext value={services}>
        <RequestForm />
      </ServicesContext>
    </QueryClientProvider>,
  )
  fireEvent.change(screen.getByLabelText('Request', { exact: true }), {
    target: { value: 'My unsaved title' },
  })
  await act(async () => {
    client.setQueryData(requestKeys.detail('north', 'record-1'), {
      ...record,
      status: 'pending',
      version: 2,
    })
    await new Promise((resolve) => setTimeout(resolve, 10))
  })
  expect(screen.getByLabelText('Request', { exact: true })).toHaveValue(
    'My unsaved title',
  )
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled()
  view.unmount()
  client.clear()
})
