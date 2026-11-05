import {
  requestSchema,
  requestInput,
  toMinorUnits,
  PAGE_SIZE,
  type RequestRecord,
  requestSearch,
} from '@/modules/requests/public'
import {
  createGrantAdapter,
  type PermissionDefinition,
  type Session,
} from '@/shared/auth/model'
import type { Transport } from '@/shared/api/client'

const titles = [
  'Office equipment',
  'Site safety supplies',
  'Software subscriptions',
  'Team training',
  'Network upgrade',
  'Meeting room setup',
  'Survey equipment',
  'Project signage',
  'Printer supplies',
  'Workshop materials',
]
const response = (body: unknown, status = 200) =>
  Response.json(body, { status })
export function createDemoTransport(catalog: readonly PermissionDefinition[]) {
  let persona = 'manager',
    workspace = 'north',
    plan = 'pro',
    requestsEnabled = true
  const records: RequestRecord[] = ['north', 'south'].flatMap((workspaceId) =>
    titles.map((title, index) => ({
      id: `${workspaceId}-${index + 1}`,
      title,
      description: `Resources needed for ${title.toLowerCase()}. Please review the proposed budget.`,
      amountMinor: [
        125000, 82000, 240000, 65000, 480000, 92000, 75000, 18000, 15000, 37000,
      ][index]!,
      status: (['draft', 'pending', 'approved'] as const)[index % 3]!,
      ownerId: index % 2 ? 'alex' : 'sam',
      ownerName: index % 2 ? 'Alex Morgan' : 'Sam Taylor',
      workspaceId,
      version: 1,
      updatedAt: new Date(Date.UTC(2026, 10, 5 - index)).toISOString(),
    })),
  )
  function session(): Session {
    const actions =
      persona === 'viewer'
        ? ['requests.read']
        : persona === 'editor'
          ? [
              'requests.read',
              'requests.create',
              'requests.edit',
              'requests.submit',
              'requests.suggest',
            ]
          : catalog.map((item) => item.action)
    return {
      user: { id: 'sam', name: 'Sam Taylor' },
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
    const actor = session()
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
    const used = records.filter(
      (item) => item.workspaceId === actor.workspace.id,
    ).length
    const quotaLimit = plan === 'pro' ? null : 10
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
      (path.startsWith('/requests') || path.startsWith('/ai/')) &&
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
    if (path === '/requests' && request.method === 'GET') {
      if (!allowed('requests.read')) return denied()
      const search = requestSearch.parse(Object.fromEntries(url.searchParams))
      const filtered = records.filter(
        (item) =>
          item.workspaceId === actor.workspace.id &&
          item.title.toLowerCase().includes(search.q.toLowerCase()) &&
          (search.status === 'all' || item.status === search.status),
      )
      filtered.sort((a, b) =>
        search.sort === 'title'
          ? a.title.localeCompare(b.title)
          : search.sort === 'amount'
            ? b.amountMinor - a.amountMinor
            : b.updatedAt.localeCompare(a.updatedAt),
      )
      return response({
        items: filtered.slice(
          (search.page - 1) * PAGE_SIZE,
          search.page * PAGE_SIZE,
        ),
        total: filtered.length,
      })
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
        amountMinor: toMinorUnits(parsed.data.amount),
        status: 'draft',
        ownerId: actor.user.id,
        ownerName: actor.user.name,
        workspaceId: actor.workspace.id,
        version: 1,
        updatedAt: new Date().toISOString(),
      })
      records.unshift(item)
      return response(item, 201)
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
