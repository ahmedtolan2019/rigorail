import type { Session } from '@/shared/auth/model'

interface View {
  id: string
  owner: string
  scope: string
  name: string
  state: { search: Record<string, unknown>; columns?: unknown }
}
const json = (body: unknown, status = 200) => Response.json(body, { status })

/** In-memory saved views (`/views`), scoped to the user and workspace. */
export function createDemoViews() {
  let next = 1
  const views: View[] = []
  const seeded = new Set<string>()
  function seed(owner: string) {
    if (seeded.has(owner)) return
    seeded.add(owner)
    views.push(
      {
        id: `v${next++}`,
        owner,
        scope: 'requests',
        name: 'Waiting for approval',
        state: { search: { status: ['pending'] } },
      },
      {
        id: `v${next++}`,
        owner,
        scope: 'requests',
        name: 'Largest first',
        state: { search: { sort: 'amount', dir: 'desc' } },
      },
    )
  }
  async function handle(request: Request, url: URL, actor: Session) {
    if (!url.pathname.startsWith('/views')) return null
    const owner = `${actor.user.id}:${actor.workspace.id}`
    seed(owner)
    if (url.pathname === '/views' && request.method === 'GET') {
      const scope = url.searchParams.get('scope') ?? ''
      return json({
        items: views
          .filter((view) => view.owner === owner && view.scope === scope)
          .map(({ id, name, state }) => ({ id, name, state })),
      })
    }
    if (url.pathname === '/views' && request.method === 'POST') {
      const body = (await request
        .json()
        .catch(() => null)) as Partial<View> | null
      const name = body?.name?.trim() ?? ''
      if (!body?.scope || name.length < 2 || name.length > 60 || !body.state)
        return json(
          { message: 'Check the view name.', code: 'validation' },
          422,
        )
      const view = {
        id: `v${next++}`,
        owner,
        scope: body.scope,
        name,
        state: body.state,
      }
      views.push(view)
      return json({ id: view.id, name: view.name, state: view.state }, 201)
    }
    const match = url.pathname.match(/^\/views\/([^/]+)$/)
    if (match && request.method === 'DELETE') {
      const index = views.findIndex(
        (view) =>
          view.id === decodeURIComponent(match[1]!) && view.owner === owner,
      )
      if (index < 0)
        return json({ message: 'View not found.', code: 'not_found' }, 404)
      views.splice(index, 1)
      return new Response(null, { status: 204 })
    }
    return null
  }
  return { handle }
}
