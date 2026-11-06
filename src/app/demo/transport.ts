import {
  bulkCommand,
  EXPORT_LIMIT,
  fromRequestQuery,
  requestCategories,
  requestSchema,
  requestInput,
  toMinorUnits,
  type RequestFilter,
  type RequestRecord,
} from '@/modules/requests/public'
import {
  createGrantAdapter,
  type PermissionDefinition,
  type Session,
} from '@/shared/auth/model'
import type { Transport } from '@/shared/api/client'
import type { Attachment, PutFile } from '@/shared/uploads/model'
import type { RealtimeEvent, RealtimeSource } from '@/shared/realtime/events'
import { createDemoIdentity, DEMO_MFA_CODE, DEMO_PASSWORD } from './identity'
import { createDemoViews } from './views'

const catalogTitles: Record<(typeof requestCategories)[number], string[]> = {
  equipment: [
    'Office equipment',
    'Site safety supplies',
    'Survey equipment',
    'Laptop refresh',
    'Warehouse scanners',
    'Field radios',
  ],
  software: [
    'Software subscriptions',
    'Design tool licenses',
    'Analytics platform renewal',
    'Security monitoring',
  ],
  training: [
    'Team training',
    'Leadership workshop',
    'Safety certification',
    'Language courses',
  ],
  services: [
    'Network upgrade',
    'Legal review',
    'Translation services',
    'Audit preparation',
  ],
  facilities: [
    'Meeting room setup',
    'Project signage',
    'Printer supplies',
    'Workshop materials',
    'Office furniture',
  ],
}
const first = [
  'Maya',
  'Yousef',
  'Ines',
  'Tom',
  'Nadia',
  'Owen',
  'Hana',
  'Diego',
  'Sara',
  'Karim',
  'Elena',
  'Ravi',
  'Mona',
  'Lucas',
  'Aisha',
  'Noah',
  'Leila',
]
const last = [
  'Chen',
  'Saleh',
  'Duarte',
  'Becker',
  'Karim',
  'Price',
  'Mansour',
  'Silva',
]
// A realistic roster so owner filters exercise top-N facets and server search.
const people = [
  { id: 'sam', name: 'Sam Taylor' },
  { id: 'alex', name: 'Alex Morgan' },
  { id: 'priya', name: 'Priya Nair' },
  { id: 'omar', name: 'Omar Haddad' },
  { id: 'lina', name: 'Lina Farouk' },
  { id: 'chen', name: 'Chen Wei' },
  ...Array.from({ length: 34 }, (_, index) => ({
    id: `p${String(index + 7).padStart(2, '0')}`,
    name: `${first[index % first.length]} ${last[(index * 3) % last.length]}`,
  })),
]
/** Top facet values returned with the list; the rest are found with owner search. */
const OWNER_FACETS = 8
const DAY = 86_400_000
/** Seeded data is anchored to the current hour so relative dates stay natural. */
export const DEMO_NOW = Math.floor(Date.now() / 3_600_000) * 3_600_000

/** Deterministic pseudo-random sequence (mulberry32). */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
function seedRecords(workspaceId: string, count: number): RequestRecord[] {
  const next = random(workspaceId === 'north' ? 7 : 13)
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(next() * items.length)]!
  return Array.from({ length: count }, (_, index) => {
    // The first records are stable references used by docs and browser tests.
    const category =
      index === 0
        ? 'equipment'
        : index === 1
          ? 'equipment'
          : pick(requestCategories)
    const title =
      index === 0
        ? 'Office equipment'
        : index === 1
          ? 'Site safety supplies'
          : pick(catalogTitles[category])
    const owner =
      index === 0 ? people[0]! : index === 1 ? people[1]! : pick(people)
    const age = index < 2 ? index : Math.floor(next() * 360)
    const created =
      index < 2
        ? DEMO_NOW - (index + 1) * 3_600_000
        : DEMO_NOW - age * DAY - Math.floor(next() * DAY)
    // Reference records are always the most recently updated.
    const updated =
      index < 2
        ? DEMO_NOW - index * 60_000
        : Math.min(
            DEMO_NOW - 10 * 60_000,
            created + Math.floor(next() * 14) * DAY,
          )
    const status =
      index === 0
        ? 'draft'
        : index === 1
          ? 'pending'
          : age > 45
            ? next() < 0.85
              ? 'approved'
              : 'pending'
            : pick(['draft', 'pending', 'approved'] as const)
    return {
      id: `${workspaceId}-${index + 1}`,
      // Newest records carry the highest reference numbers.
      reference: `REQ-${(workspaceId === 'north' ? 1000 : 5000) + count - index}`,
      title,
      description: `Resources needed for ${title.toLowerCase()}. Please review the proposed budget and delivery timeline.`,
      category,
      amountMinor:
        index === 0
          ? 125000
          : Math.round(((8 + next() * next() * 4800) * 100) / 50) * 50,
      status,
      ownerId: owner.id,
      ownerName: owner.name,
      workspaceId,
      version: 1,
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(Math.max(created, updated)).toISOString(),
      attachments:
        index % 4 === 0
          ? [
              {
                id: `${workspaceId}-${index + 1}-quote`,
                name: 'Supplier quote.pdf',
                size: 184_320,
                type: 'application/pdf',
              },
            ]
          : [],
    }
  })
}
const response = (body: unknown, status = 200) =>
  Response.json(body, { status })
function matches(
  item: RequestRecord,
  filter: RequestFilter,
  skip?: keyof RequestFilter,
) {
  const q = filter.q.toLowerCase()
  return (
    (!q ||
      item.title.toLowerCase().includes(q) ||
      item.reference.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)) &&
    (skip === 'status' ||
      !filter.status.length ||
      filter.status.includes(item.status)) &&
    (skip === 'category' ||
      !filter.category.length ||
      filter.category.includes(item.category)) &&
    (skip === 'owner' ||
      !filter.owner.length ||
      filter.owner.includes(item.ownerId)) &&
    (!filter.from || item.createdAt.slice(0, 10) >= filter.from) &&
    (!filter.to || item.createdAt.slice(0, 10) <= filter.to)
  )
}
function ownerCounts(scoped: RequestRecord[], filter: RequestFilter) {
  return people
    .map((person) => ({
      ...person,
      count: scoped.filter(
        (item) => item.ownerId === person.id && matches(item, filter, 'owner'),
      ).length,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}
function ownerFacets(scoped: RequestRecord[], filter: RequestFilter) {
  const counts = ownerCounts(scoped, filter).filter(
    (person) => person.count > 0 || filter.owner.includes(person.id),
  )
  const top = counts.slice(0, OWNER_FACETS)
  return {
    owner: [
      ...top,
      ...counts.filter(
        (person) => filter.owner.includes(person.id) && !top.includes(person),
      ),
    ],
    ownerTotal: counts.length,
  }
}
export function createDemoTransport(catalog: readonly PermissionDefinition[]) {
  let persona = 'manager',
    workspace = 'north',
    plan = 'pro',
    requestsEnabled = true
  const records: RequestRecord[] = [
    ...seedRecords('north', 240),
    ...seedRecords('south', 180),
  ]
  const identity = createDemoIdentity()
  const uploads = new Map<string, Attachment>()
  // Live updates: a teammate occasionally approves a pending request in this
  // workspace, as another user would. Off under automation so tests stay stable.
  const listeners = new Set<(event: RealtimeEvent) => void>()
  let teammate: ReturnType<typeof setInterval> | undefined
  function approveAsTeammate() {
    if (!identity.signedIn) return
    const pending = records.find(
      (item) => item.workspaceId === workspace && item.status === 'pending',
    )
    if (!pending) return
    pending.status = 'approved'
    pending.version++
    pending.updatedAt = new Date().toISOString()
    for (const notify of listeners)
      notify({ topic: 'requests', ids: [pending.id] })
  }
  const events: RealtimeSource = (listener) => {
    listeners.add(listener)
    if (!teammate && !navigator.webdriver)
      teammate = setInterval(approveAsTeammate, 45_000)
    return () => {
      listeners.delete(listener)
      if (!listeners.size && teammate) {
        clearInterval(teammate)
        teammate = undefined
      }
    }
  }

  const savedViews = createDemoViews()
  function session(): Session {
    const actions =
      persona === 'viewer'
        ? ['requests.read', 'reports.read']
        : persona === 'editor'
          ? [
              'requests.read',
              'requests.create',
              'requests.edit',
              'requests.submit',
              'requests.suggest',
              'reports.read',
            ]
          : catalog.map((item) => item.action)
    return {
      user: { id: 'sam', ...identity.user },
      workspace: {
        id: workspace,
        name: workspace === 'north' ? 'North workspace' : 'South workspace',
      },
      revision: `${persona}:${workspace}:${plan}:${requestsEnabled}`,
      grants: actions.map((action) => ({
        action,
        scope:
          persona === 'editor' &&
          ['requests.edit', 'requests.submit'].includes(action)
            ? 'own'
            : 'workspace',
      })),
    }
  }
  const transport: Transport = async (request) => {
    await new Promise<void>((resolve, reject) => {
      if (request.signal.aborted) {
        reject(request.signal.reason)
        return
      }
      const abort = () => {
        clearTimeout(timer)
        reject(request.signal.reason)
      }
      const timer = setTimeout(() => {
        request.signal.removeEventListener('abort', abort)
        resolve()
      }, 140)
      request.signal.addEventListener('abort', abort, { once: true })
    })
    request.signal.throwIfAborted()
    const url = new URL(request.url),
      path = url.pathname
    const identityResponse = await identity.handle(request, path)
    if (identityResponse) return identityResponse
    if (!identity.signedIn)
      return response(
        { message: 'Sign in to continue.', code: 'unauthenticated' },
        401,
      )
    const actor = session()
    const viewResponse = await savedViews.handle(request, url, actor)
    if (viewResponse) return viewResponse
    const access = createGrantAdapter(actor, catalog)
    const allowed = (action: string, resource?: RequestRecord) =>
      access.decide(action, resource).status === 'allowed'
    const denied = () =>
      response(
        {
          message: 'Your current access does not allow this action.',
          code: 'forbidden',
        },
        403,
      )
    if (path === '/session') return response(actor)
    const requestLimit = actor.workspace.id === 'north' ? 500000 : 250000
    // Rolling 30-day creation quota; the starter plan is deliberately at its limit.
    const used = records.filter(
      (item) =>
        item.workspaceId === actor.workspace.id &&
        Date.parse(item.createdAt) > DEMO_NOW - 30 * DAY,
    ).length
    const quotaLimit = plan === 'pro' ? null : Math.min(used, 10)
    if (path === '/capabilities')
      return response({
        revision: actor.revision,
        flags: { requests: requestsEnabled, aiSuggestions: true },
        entitlements:
          plan === 'none'
            ? []
            : plan === 'pro'
              ? ['requests', 'aiSuggestions']
              : ['requests'],
        subscription: { plan, status: plan === 'none' ? 'none' : 'active' },
        quotas: { 'requests.create': { used, limit: quotaLimit } },
      })
    if (
      (path.startsWith('/requests') ||
        path.startsWith('/reports') ||
        path.startsWith('/ai/')) &&
      (!requestsEnabled || plan === 'none')
    )
      return denied()
    if (path === '/configuration')
      return response({
        revision: 'demo-1',
        limits: { requestAmountMinor: requestLimit },
        features: { aiSuggestions: true },
      })
    if (path === '/ai/suggestions' && request.method === 'POST') {
      if (plan !== 'pro' || !allowed('requests.suggest')) return denied()
      const encoder = new TextEncoder()
      const body = (await request.json()) as { language?: string }
      const chunks =
        body.language === 'ar'
          ? [
              'يدعم هذا الطلب ',
              'احتياجات الفريق التشغيلية الحالية. ',
              'راجع النطاق والميزانية ومتطلبات التسليم قبل الاعتماد.',
            ]
          : [
              'This request supports ',
              'the team’s current operational needs. ',
              'Confirm the scope, budget, and delivery requirements before approval.',
            ]
      let index = 0
      return new Response(
        new ReadableStream({
          async pull(controller) {
            await new Promise((resolve) => setTimeout(resolve, 180))
            if (request.signal.aborted) {
              controller.error(request.signal.reason)
              return
            }
            controller.enqueue(
              encoder.encode(
                JSON.stringify(
                  index < chunks.length
                    ? { type: 'delta', text: chunks[index++] }
                    : { type: 'done' },
                ) + '\n',
              ),
            )
            if (index > chunks.length - 1) {
              controller.enqueue(encoder.encode('{"type":"done"}\n'))
              controller.close()
            }
          },
        }),
        { headers: { 'Content-Type': 'application/x-ndjson' } },
      )
    }
    if (path === '/requests/owners' && request.method === 'GET') {
      if (!allowed('requests.read')) return denied()
      const filter = fromRequestQuery(url.searchParams)
      const name = (url.searchParams.get('name') ?? '').toLowerCase()
      const scoped = records.filter(
        (item) => item.workspaceId === actor.workspace.id,
      )
      return response({
        items: ownerCounts(scoped, filter)
          .filter((person) => person.name.toLowerCase().includes(name))
          .slice(0, 20),
      })
    }
    if (
      (path === '/requests' || path === '/requests/export') &&
      request.method === 'GET'
    ) {
      if (!allowed('requests.read')) return denied()
      const search = fromRequestQuery(url.searchParams)
      const scoped = records.filter(
        (item) => item.workspaceId === actor.workspace.id,
      )
      const filtered = scoped.filter((item) => matches(item, search))
      const key = (item: RequestRecord) =>
        search.sort === 'title'
          ? item.title
          : search.sort === 'amount'
            ? item.amountMinor
            : search.sort === 'status'
              ? item.status
              : search.sort === 'owner'
                ? item.ownerName
                : search.sort === 'created'
                  ? item.createdAt
                  : item.updatedAt
      filtered.sort((a, b) => {
        const left = key(a),
          right = key(b)
        const order =
          typeof left === 'number' && typeof right === 'number'
            ? left - right
            : String(left).localeCompare(String(right))
        return (
          (search.dir === 'asc' ? order : -order) || a.id.localeCompare(b.id)
        )
      })
      const facet = <K extends 'status' | 'category'>(
        field: K,
        keys: readonly RequestRecord[K][],
      ) =>
        Object.fromEntries(
          keys.map((value) => [
            value,
            scoped.filter(
              (item) => item[field] === value && matches(item, search, field),
            ).length,
          ]),
        )
      if (path === '/requests/export')
        return response({
          items: filtered.slice(0, EXPORT_LIMIT),
          total: filtered.length,
          truncated: filtered.length > EXPORT_LIMIT,
        })
      return response({
        items: filtered.slice(
          (search.page - 1) * search.size,
          search.page * search.size,
        ),
        total: filtered.length,
        facets: {
          status: facet('status', ['draft', 'pending', 'approved']),
          category: facet('category', requestCategories),
          ...ownerFacets(scoped, search),
        },
      })
    }
    if (path === '/reports/requests' && request.method === 'GET') {
      if (!allowed('reports.read')) return denied()
      const params = url.searchParams
      const isoDay = /^\d{4}-\d{2}-\d{2}$/
      const fromParam = params.get('from') ?? '',
        toParam = params.get('to') ?? ''
      if (
        !isoDay.test(fromParam) ||
        !isoDay.test(toParam) ||
        fromParam > toParam
      )
        return response(
          { message: 'Choose a valid date range.', code: 'validation' },
          422,
        )
      const start = Date.parse(`${fromParam}T00:00:00Z`)
      const end = Date.parse(`${toParam}T23:59:59.999Z`)
      const days = Math.round((end + 1 - start) / DAY)
      const bucket = days <= 31 ? 'day' : days <= 120 ? 'week' : 'month'
      const categories = params.getAll('category'),
        owners = params.getAll('owner')
      const workspaceRecords = records.filter(
        (item) => item.workspaceId === actor.workspace.id,
      )
      const scoped = workspaceRecords.filter(
        (item) =>
          (!categories.length || categories.includes(item.category)) &&
          (!owners.length || owners.includes(item.ownerId)),
      )
      const createdIn = (from: number, to: number) =>
        scoped.filter((item) => {
          const created = Date.parse(item.createdAt)
          return created >= from && created <= to
        })
      const sum = (list: RequestRecord[]) =>
        list.reduce((total, item) => total + item.amountMinor, 0)
      const totals = (items: RequestRecord[]) => {
        const approved = items.filter((item) => item.status === 'approved')
        const submitted = items.filter((item) => item.status !== 'draft')
        return {
          count: items.length,
          amountMinor: sum(items),
          approvedCount: approved.length,
          approvedAmountMinor: sum(approved),
          approvalRate: submitted.length
            ? approved.length / submitted.length
            : null,
          cycleDays: approved.length
            ? approved.reduce(
                (total, item) =>
                  total +
                  (Date.parse(item.updatedAt) - Date.parse(item.createdAt)) /
                    DAY,
                0,
              ) / approved.length
            : null,
        }
      }
      const bucketStart = (time: number) => {
        const day = new Date(time)
        day.setUTCHours(0, 0, 0, 0)
        if (bucket === 'week')
          day.setUTCDate(day.getUTCDate() - day.getUTCDay())
        if (bucket === 'month') day.setUTCDate(1)
        return day.toISOString().slice(0, 10)
      }
      const buckets = (from: number) => {
        const keys: string[] = []
        for (let offset = 0; offset < days; offset++) {
          const key = bucketStart(from + offset * DAY)
          if (keys[keys.length - 1] !== key) keys.push(key)
        }
        return keys
      }
      const current = createdIn(start, end)
      const compare = params.get('compare') !== 'false'
      const previousStart = start - days * DAY
      const previous = createdIn(previousStart, start - 1)
      const currentKeys = buckets(start),
        previousKeys = buckets(previousStart)
      const series = currentKeys.map((period, index) => {
        const created = current.filter(
          (item) => bucketStart(Date.parse(item.createdAt)) === period,
        )
        const approved = scoped.filter(
          (item) =>
            item.status === 'approved' &&
            Date.parse(item.updatedAt) >= start &&
            Date.parse(item.updatedAt) <= end &&
            bucketStart(Date.parse(item.updatedAt)) === period,
        )
        const previousPeriod = previousKeys[index]
        const before = previousPeriod
          ? previous.filter(
              (item) =>
                bucketStart(Date.parse(item.createdAt)) === previousPeriod,
            )
          : []
        return {
          period,
          created: created.length,
          approved: approved.length,
          amountMinor: sum(created),
          approvedAmountMinor: sum(approved),
          previousCreated: compare ? before.length : null,
          previousAmountMinor: compare ? sum(before) : null,
        }
      })
      const row = (key: string, label: string, items: RequestRecord[]) => ({
        key,
        label,
        count: items.length,
        draft: items.filter((item) => item.status === 'draft').length,
        pending: items.filter((item) => item.status === 'pending').length,
        approved: items.filter((item) => item.status === 'approved').length,
        amountMinor: sum(items),
        approvedAmountMinor: sum(
          items.filter((item) => item.status === 'approved'),
        ),
      })
      return response({
        from: fromParam,
        to: toParam,
        bucket,
        totals: totals(current),
        previous: compare ? totals(previous) : null,
        series,
        byStatus: Object.fromEntries(
          (['draft', 'pending', 'approved'] as const).map((status) => [
            status,
            current.filter((item) => item.status === status).length,
          ]),
        ),
        breakdown: {
          category: requestCategories.map((category) =>
            row(
              category,
              category,
              current.filter((item) => item.category === category),
            ),
          ),
          owner: people
            .map((person) =>
              row(
                person.id,
                person.name,
                current.filter((item) => item.ownerId === person.id),
              ),
            )
            .filter((item) => item.count > 0),
        },
        owners: people.filter((person) =>
          workspaceRecords.some((item) => item.ownerId === person.id),
        ),
      })
    }
    if (path === '/requests/bulk' && request.method === 'POST') {
      const parsed = bulkCommand.safeParse(await request.json())
      if (!parsed.success)
        return response(
          { message: 'Check the bulk command.', code: 'validation' },
          422,
        )
      const { action, target } = parsed.data
      const scoped = records.filter(
        (item) => item.workspaceId === actor.workspace.id,
      )
      const ids =
        target.mode === 'ids'
          ? target.ids
          : scoped
              .filter(
                (item) =>
                  matches(item, target.filter) &&
                  !target.excluded.includes(item.id),
              )
              .map((item) => item.id)
      const succeeded: string[] = [],
        failed: { id: string; code: 'forbidden' | 'conflict' | 'not_found' }[] =
          []
      for (const id of ids) {
        const item = scoped.find((record) => record.id === id)
        if (!item) failed.push({ id, code: 'not_found' })
        else if (!allowed(`requests.${action}`, item))
          failed.push({ id, code: 'forbidden' })
        else if (item.status !== (action === 'approve' ? 'pending' : 'draft'))
          failed.push({ id, code: 'conflict' })
        else {
          item.status = action === 'approve' ? 'approved' : 'pending'
          item.version++
          item.updatedAt = new Date().toISOString()
          succeeded.push(id)
        }
      }
      return response({ succeeded, failed })
    }
    if (path === '/requests' && request.method === 'POST') {
      if (!allowed('requests.create')) return denied()
      if (quotaLimit !== null && used >= quotaLimit)
        return response({ message: 'Usage limit reached.', code: 'quota' }, 409)
      const parsed = requestInput.safeParse(await request.json())
      if (!parsed.success)
        return response(
          { message: 'Check the request fields.', code: 'validation' },
          422,
        )
      if (toMinorUnits(parsed.data.amount) > requestLimit)
        return response(
          {
            message: 'Amount exceeds the workspace limit.',
            code: 'validation',
            fields: { amount: 'limit' },
          },
          422,
        )
      const item = requestSchema.parse({
        ...parsed.data,
        id: crypto.randomUUID(),
        reference: `REQ-${
          Math.max(
            0,
            ...records
              .filter((record) => record.workspaceId === actor.workspace.id)
              .map((record) => Number(record.reference.slice(4))),
          ) + 1
        }`,
        amountMinor: toMinorUnits(parsed.data.amount),
        status: 'draft',
        ownerId: actor.user.id,
        ownerName: actor.user.name,
        workspaceId: actor.workspace.id,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
      })
      records.unshift(item)
      return response(item, 201)
    }
    // Uploads: tickets point at simulated storage (see putFile below).
    if (path === '/uploads' && request.method === 'POST') {
      const meta = (await request.json().catch(() => null)) as Attachment | null
      if (!meta?.name || !(meta.size >= 0))
        return response({ message: 'Check the file.', code: 'validation' }, 422)
      if (meta.size > 10 * 1024 * 1024)
        return response({ message: 'File too large.', code: 'too_large' }, 413)
      const id = `upload-${crypto.randomUUID()}`
      uploads.set(id, { id, name: meta.name, size: meta.size, type: meta.type })
      return response({ id, url: `demo://storage/${id}`, method: 'PUT' }, 201)
    }
    const attach = path.match(
      /^\/requests\/([^/]+)\/attachments(?:\/([^/]+))?$/,
    )
    if (attach) {
      const item = records.find(
        (record) =>
          record.id === decodeURIComponent(attach[1]!) &&
          record.workspaceId === actor.workspace.id,
      )
      if (!item)
        return response(
          { message: 'Request not found.', code: 'not_found' },
          404,
        )
      if (!allowed('requests.edit', item)) return denied()
      if (request.method === 'POST' && !attach[2]) {
        const body = (await request.json().catch(() => null)) as {
          uploadId?: string
        } | null
        const file = body?.uploadId ? uploads.get(body.uploadId) : undefined
        if (!file)
          return response(
            { message: 'Upload not found.', code: 'not_found' },
            404,
          )
        if (item.attachments.length >= 10)
          return response(
            { message: 'Too many files.', code: 'validation' },
            422,
          )
        item.attachments.push(file)
      } else if (request.method === 'DELETE' && attach[2]) {
        item.attachments = item.attachments.filter(
          (file) => file.id !== decodeURIComponent(attach[2]!),
        )
      } else
        return response({ message: 'Method not allowed.', code: 'method' }, 405)
      item.updatedAt = new Date().toISOString()
      return response(item)
    }
    const match = path.match(/^\/requests\/([^/]+)(?:\/(submit|approve))?$/)
    if (match) {
      const item = records.find(
        (record) =>
          record.id === decodeURIComponent(match[1]!) &&
          record.workspaceId === actor.workspace.id,
      )
      if (!item)
        return response(
          { message: 'Request not found.', code: 'not_found' },
          404,
        )
      if (request.method === 'GET')
        return allowed('requests.read', item) ? response(item) : denied()
      const action = match[2] ?? 'edit'
      if (!allowed(`requests.${action}`, item)) return denied()
      const body: unknown = await request.json()
      if (
        typeof body !== 'object' ||
        body === null ||
        !('version' in body) ||
        body.version !== item.version
      )
        return response(
          {
            message:
              'This record changed. Reload the latest version before trying again.',
            code: 'conflict',
          },
          409,
        )
      if (
        (action === 'approve' && item.status !== 'pending') ||
        (action !== 'approve' && item.status !== 'draft')
      )
        return response(
          {
            message: 'This action is not valid in the current status.',
            code: 'conflict',
          },
          409,
        )
      if (action === 'edit' && request.method === 'PATCH') {
        const parsed = requestInput.safeParse(body)
        if (!parsed.success)
          return response(
            { message: 'Check the request fields.', code: 'validation' },
            422,
          )
        if (toMinorUnits(parsed.data.amount) > requestLimit)
          return response(
            {
              message: 'Amount exceeds the workspace limit.',
              code: 'validation',
              fields: { amount: 'limit' },
            },
            422,
          )
        Object.assign(item, {
          title: parsed.data.title,
          category: parsed.data.category,
          description: parsed.data.description,
          amountMinor: toMinorUnits(parsed.data.amount),
        })
      } else if (request.method === 'POST' && match[2])
        item.status = action === 'approve' ? 'approved' : 'pending'
      else
        return response({ message: 'Method not allowed.', code: 'method' }, 405)
      item.version++
      item.updatedAt = new Date().toISOString()
      return response(item)
    }
    return response({ message: 'Endpoint not found.', code: 'not_found' }, 404)
  }
  return {
    transport,
    events,
    /** Simulated storage transfer with real progress events and cancellation. */
    putFile: ((_, file, { onProgress, signal }) =>
      new Promise<void>((resolve, reject) => {
        let sent = 0
        const step = Math.max(file.size / 8, 1)
        const timer = setInterval(() => {
          sent = Math.min(file.size, sent + step)
          onProgress(file.size ? sent / file.size : 1)
          if (sent >= file.size) {
            clearInterval(timer)
            resolve()
          }
        }, 120)
        signal.addEventListener(
          'abort',
          () => {
            clearInterval(timer)
            reject(signal.reason)
          },
          { once: true },
        )
      })) satisfies PutFile,
    /** Shown on the demo sign-in page. */
    credentials: { password: DEMO_PASSWORD, mfaCode: DEMO_MFA_CODE },
    get plan() {
      return plan
    },
    get requestsEnabled() {
      return requestsEnabled
    },
    setPlan(value: string) {
      plan = ['pro', 'starter', 'none'].includes(value) ? value : 'none'
    },
    setRequestsEnabled(value: boolean) {
      requestsEnabled = value
    },
    get persona() {
      return persona
    },
    get workspace() {
      return workspace
    },
    setPersona(value: string) {
      persona = ['manager', 'editor', 'viewer'].includes(value)
        ? value
        : 'viewer'
    },
    setWorkspace(value: string) {
      workspace = value === 'south' ? 'south' : 'north'
    },
  }
}
