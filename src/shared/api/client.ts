import { z } from 'zod'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly code = 'network',
    readonly fields: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
const errorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  fields: z.record(z.string(), z.string()).optional(),
})
export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number
}
export type Transport = (input: Request) => Promise<Response>
export class ApiClient {
  constructor(
    readonly baseUrl: string,
    private transport: Transport = (request) => fetch(request),
    readonly timeoutMs = 15_000,
  ) {}

  async response(
    path: string,
    { timeoutMs = this.timeoutMs, ...init }: ApiRequestOptions = {},
  ): Promise<Response> {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0)
      throw new ApiError(
        'Timeout must be a positive integer.',
        0,
        'configuration',
      )
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://'))
      throw new ApiError('API paths must be relative.', 0, 'configuration')
    const url = new URL(this.baseUrl.replace(/\/$/, '') + path)
    const signal = init.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)])
      : AbortSignal.timeout(timeoutMs)
    signal.throwIfAborted()
    let response: Response
    try {
      response = await this.transport(
        new Request(url, {
          ...init,
          signal,
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...(init.body ? { 'Content-Type': 'application/json' } : {}),
            ...Object.fromEntries(new Headers(init.headers)),
          },
        }),
      )
    } catch (error) {
      if (signal.aborted) throw signal.reason
      throw new ApiError(
        error instanceof Error
          ? error.message
          : 'The service could not be reached.',
      )
    }
    if (!response.ok) {
      const body = errorSchema.safeParse(
        await response.json().catch(() => null),
      )
      throw new ApiError(
        body.success
          ? body.data.message
          : `Request failed (${response.status}).`,
        response.status,
        body.success ? body.data.code : 'http',
        body.success ? body.data.fields : {},
      )
    }
    return response
  }

  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    init: ApiRequestOptions = {},
  ): Promise<T> {
    const response = await this.response(path, init)
    const text = await response.text()
    let value: unknown
    try {
      value = text ? JSON.parse(text) : undefined
    } catch {
      throw new ApiError(
        'The service returned invalid JSON.',
        response.status,
        'invalid_response',
      )
    }
    const result = schema.safeParse(value)
    if (!result.success)
      throw new ApiError(
        'The service response did not match its contract.',
        response.status,
        'invalid_response',
      )
    return result.data
  }
}
