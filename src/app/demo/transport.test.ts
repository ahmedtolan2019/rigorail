// @vitest-environment node
import { expect, test } from 'vitest'
import { z } from 'zod'
import { ApiClient } from '@/shared/api/client'
import { requestPermissions, requestSchema } from '@/modules/requests/public'
import {
  reportPermissions,
  requestReportSchema,
} from '@/modules/reports/public'
import { createDemoTransport } from './transport'

const list = z.object({
  items: z.array(requestSchema),
  total: z.number(),
  facets: z.object({
    status: z.record(z.string(), z.number()),
    category: z.record(z.string(), z.number()),
    owner: z.array(z.object({ id: z.string(), count: z.number() })),
  }),
})
const bulk = z.object({
  succeeded: z.array(z.string()),
  failed: z.array(z.object({ id: z.string(), code: z.string() })),
})
const setup = () => {
  const demo = createDemoTransport([
    ...requestPermissions,
    ...reportPermissions,
  ])
  return { demo, api: new ApiClient('https://demo.local', demo.transport) }
}

test('reference transport enforces workspace, ownership, quotas and optimistic concurrency', async () => {
  const { demo, api } = setup()
  const values = {
    title: 'New equipment',
    category: 'equipment',
    description: '',
    amount: '12.50',
  }
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
  const { items } = await api.request('/requests?status=draft&size=50', list)
  const foreign = items.find((item) => item.ownerId !== 'sam')!
  await expect(
    api.request(`/requests/${foreign.id}`, requestSchema, {
      method: 'PATCH',
      body: JSON.stringify({ ...values, version: foreign.version }),
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

test('list supports multi-value filters, sorting, page size and exclusive facets', async () => {
  const { api } = setup()
  const all = await api.request('/requests?size=50', list)
  expect(all.items).toHaveLength(50)
  const filtered = await api.request(
    '/requests?status=draft&status=pending&category=software&sort=amount&dir=asc&size=50',
    list,
  )
  expect(filtered.items.every((item) => item.category === 'software')).toBe(
    true,
  )
  expect(filtered.items.every((item) => item.status !== 'approved')).toBe(true)
  const amounts = filtered.items.map((item) => item.amountMinor)
  expect(amounts).toEqual([...amounts].sort((a, b) => a - b))
  // A facet ignores its own filter so other options stay visible with counts.
  expect(filtered.facets.status.approved).toBeGreaterThan(0)
  expect(filtered.facets.category.software).toBe(filtered.total)
})

test('bulk commands accept ids or a filter and report per-record failures', async () => {
  const { demo, api } = setup()
  const pending = await api.request('/requests?status=pending&size=50', list)
  const draft = await api.request('/requests?status=draft&size=10', list)
  const byIds = await api.request('/requests/bulk', bulk, {
    method: 'POST',
    body: JSON.stringify({
      action: 'approve',
      target: {
        mode: 'ids',
        ids: [pending.items[0]!.id, draft.items[0]!.id, 'missing'],
      },
    }),
  })
  expect(byIds.succeeded).toEqual([pending.items[0]!.id])
  expect(byIds.failed.map((item) => item.code).sort()).toEqual([
    'conflict',
    'not_found',
  ])
  const excluded = pending.items[1]!.id
  const byFilter = await api.request('/requests/bulk', bulk, {
    method: 'POST',
    body: JSON.stringify({
      action: 'approve',
      target: {
        mode: 'all',
        excluded: [excluded],
        filter: { q: '', status: ['pending'], category: [], owner: [] },
      },
    }),
  })
  expect(byFilter.succeeded).toHaveLength(pending.total - 2)
  expect(byFilter.succeeded).not.toContain(excluded)
  demo.setPersona('viewer')
  const denied = await api.request('/requests/bulk', bulk, {
    method: 'POST',
    body: JSON.stringify({
      action: 'approve',
      target: { mode: 'ids', ids: [excluded] },
    }),
  })
  expect(denied.failed).toEqual([{ id: excluded, code: 'forbidden' }])
})

test('reports aggregate a date window, filters and an aligned comparison', async () => {
  const { api } = setup()
  const iso = (days: number) =>
    new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
  for (const [days, bucket] of [
    [30, 'day'],
    [90, 'week'],
    [365, 'month'],
  ] as const) {
    const report = await api.request(
      `/reports/requests?from=${iso(days - 1)}&to=${iso(0)}`,
      requestReportSchema,
    )
    expect(report.bucket).toBe(bucket)
    expect(report.series.reduce((sum, item) => sum + item.created, 0)).toBe(
      report.totals.count,
    )
    expect(
      Object.values(report.byStatus).reduce((sum, value) => sum + value, 0),
    ).toBe(report.totals.count)
    expect(report.previous).not.toBeNull()
    expect(report.series.every((item) => item.previousCreated !== null)).toBe(
      true,
    )
  }
  const filtered = await api.request(
    `/reports/requests?from=${iso(364)}&to=${iso(0)}&category=software&compare=false`,
    requestReportSchema,
  )
  expect(filtered.previous).toBeNull()
  expect(
    filtered.breakdown.category
      .filter((row) => row.key !== 'software')
      .every((row) => row.count === 0),
  ).toBe(true)
  await expect(
    api.request('/reports/requests?from=2026-02-01&to=2026-01-01', z.unknown()),
  ).rejects.toMatchObject({ status: 422 })
})

test('exports return every matching record with business references', async () => {
  const { api } = setup()
  const exported = await api.request(
    '/requests/export?category=equipment&sort=amount&dir=desc',
    z.object({
      items: z.array(requestSchema),
      total: z.number(),
      truncated: z.boolean(),
    }),
  )
  expect(exported.items).toHaveLength(exported.total)
  expect(exported.truncated).toBe(false)
  expect(exported.items.every((item) => /^REQ-\d+$/.test(item.reference))).toBe(
    true,
  )
})

test('owner facets stay small and owner search scales to large rosters', async () => {
  const { api } = setup()
  const owners = z.object({
    items: z.array(
      z.object({ id: z.string(), name: z.string(), count: z.number() }),
    ),
  })
  const page = await api.request(
    '/requests?owner=p40',
    list.extend({
      facets: list.shape.facets.extend({ ownerTotal: z.number() }),
    }),
  )
  expect(page.facets.ownerTotal).toBeGreaterThan(8)
  // Top owners by count, plus any selected owner outside the top.
  expect(page.facets.owner.length).toBeLessThanOrEqual(9)
  expect(page.facets.owner.some((owner) => owner.id === 'p40')).toBe(true)
  const found = await api.request('/requests/owners?name=karim', owners)
  expect(found.items.length).toBeGreaterThan(0)
  expect(found.items.every((item) => /karim/i.test(item.name))).toBe(true)
  const counts = found.items.map((item) => item.count)
  expect(counts).toEqual([...counts].sort((a, b) => b - a))
})
