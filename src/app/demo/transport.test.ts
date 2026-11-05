// @vitest-environment node
import { expect, test } from 'vitest'
import { z } from 'zod'
import { ApiClient } from '@/shared/api/client'
import { requestPermissions, requestSchema } from '@/modules/requests/public'
import { createDemoTransport } from './transport'

test('reference transport enforces workspace, ownership, quotas and optimistic concurrency', async () => {
  const demo = createDemoTransport(requestPermissions),
    api = new ApiClient('https://demo.local', demo.transport)
  const values = { title: 'New equipment', description: '', amount: '12.50' }
  const item = await api.request('/requests', requestSchema, {
    method: 'POST',
    body: JSON.stringify(values),
  })
  expect(item.amountMinor).toBe(1250)
  const updated = await api.request(`/requests/${item.id}`, requestSchema, {
    method: 'PATCH',
    body: JSON.stringify({ ...values, version: item.version }),
  })
  expect(updated.version).toBe(2)
  await expect(
    api.request(`/requests/${item.id}`, requestSchema, {
      method: 'PATCH',
      body: JSON.stringify({ ...values, version: 1 }),
    }),
  ).rejects.toMatchObject({ status: 409 })
  demo.setWorkspace('south')
  await expect(
    api.request(`/requests/${item.id}`, requestSchema),
  ).rejects.toMatchObject({ status: 404 })
  demo.setPersona('editor')
  await expect(
    api.request('/requests/south-4', requestSchema, {
      method: 'PATCH',
      body: JSON.stringify({ ...values, version: 1 }),
    }),
  ).rejects.toMatchObject({ status: 403 })
  demo.setPlan('starter')
  await expect(
    api.request('/requests', requestSchema, {
      method: 'POST',
      body: JSON.stringify(values),
    }),
  ).rejects.toMatchObject({ code: 'quota' })
  demo.setRequestsEnabled(false)
  await expect(api.request('/requests', z.unknown())).rejects.toMatchObject({
    status: 403,
  })
})
