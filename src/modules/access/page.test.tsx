import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, test } from 'vitest'
import { defineTranslations } from '@/shared/i18n'
import { ApiClient } from '@/shared/api/client'
import { ServicesContext, type Services } from '@/shared/api/services'
import Access from './page'

test('permission labels belong to their domain and absent quotas are not called unlimited', () => {
  defineTranslations(
    'invoices',
    { read: 'View invoices' },
    { read: 'عرض الفواتير' },
  )
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  })
  client.setQueryData(['capabilities', 'a', 'north', '1'], {
    revision: '1',
    flags: {},
    entitlements: [],
    subscription: { plan: 'starter', status: 'cancelled' },
    quotas: {},
  })
  client.setQueryData(['configuration', 'a', 'north', '1'], {
    revision: '1',
    limits: { requestAmountMinor: 100 },
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
    catalog: [{ action: 'invoices.read', labelKey: 'invoices:read' }],
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
        <Access />
      </ServicesContext>
    </QueryClientProvider>,
  )
  expect(screen.getByText('View invoices')).toBeVisible()
  expect(screen.queryByText(/Unlimited/)).not.toBeInTheDocument()
  expect(screen.getByText('Plan: Starter · Status: Cancelled')).toBeVisible()
  view.unmount()
  client.clear()
})
