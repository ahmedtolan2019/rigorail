import { act, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, test } from 'vitest'
import { ServicesContext, type Services } from '../api/services'
import { ApiClient } from '../api/client'
import { useConfiguration, selectRequestLimit } from './business'

test('only rerenders a limit consumer when its selected value changes', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  })
  const key = ['configuration', 'a', 'north', '1']
  const configuration = {
    revision: '1',
    limits: { requestAmountMinor: 200 },
    features: { aiSuggestions: false },
  }
  client.setQueryData(key, configuration)
  let renders = 0
  function Limit() {
    const { data } = useConfiguration(selectRequestLimit)
    renders++
    return <p>{data}</p>
  }
  const services: Services = {
    api: new ApiClient('https://example.test'),
    session: {
      user: { id: 'a', name: 'A' },
      workspace: { id: 'north', name: 'North' },
      revision: '1',
      grants: [],
    },
    access: { decide: () => ({ status: 'denied', reason: 'deniedHint' }) },
    catalog: [],
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
        <Limit />
      </ServicesContext>
    </QueryClientProvider>,
  )
  const initialRenders = renders
  await act(async () => {
    client.setQueryData(key, {
      ...configuration,
      revision: '2',
      features: { aiSuggestions: true },
    })
    await new Promise((resolve) => setTimeout(resolve, 10))
  })
  expect(renders).toBe(initialRenders)
  await act(async () => {
    client.setQueryData(key, {
      ...configuration,
      limits: { requestAmountMinor: 300 },
    })
    await new Promise((resolve) => setTimeout(resolve, 10))
  })
  expect(screen.getByText('300')).toBeVisible()
  expect(renders).toBe(initialRenders + 1)
  view.unmount()
  client.clear()
})
