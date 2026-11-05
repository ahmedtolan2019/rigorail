import { z } from 'zod'

const schema = z
  .object({
    VITE_ENABLE_AI: z.enum(['true', 'false']).default('false'),
    VITE_APP_MODE: z.enum(['demo', 'api']).default('api'),
    VITE_API_BASE_URL: z
      .string()
      .url()
      .refine((value) => {
        try {
          const url = new URL(value)
          return (
            ['http:', 'https:'].includes(url.protocol) &&
            !url.username &&
            !url.password &&
            !url.search &&
            !url.hash
          )
        } catch {
          return false
        }
      }, 'Use an HTTP(S) API base URL without credentials, query parameters or fragments.')
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.VITE_APP_MODE === 'api' && !value.VITE_API_BASE_URL) {
      context.addIssue({
        code: 'custom',
        path: ['VITE_API_BASE_URL'],
        message: 'API mode requires an external API base URL.',
      })
    }
  })
export function parseEnvironment(input: Record<string, unknown>) {
  return schema.parse(input)
}
