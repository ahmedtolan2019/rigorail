import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useServices } from '../api/services'
export const configurationSchema = z.object({
  revision: z.string(),
  limits: z.object({
    requestAmountMinor: z.number().int().min(1).max(999999999),
  }),
  features: z.object({ aiSuggestions: z.boolean() }),
})
export type BusinessConfiguration = z.infer<typeof configurationSchema>
export function useConfiguration<T>(
  select: (configuration: BusinessConfiguration) => T,
) {
  const { api, session } = useServices()
  return useQuery({
    queryKey: [
      'configuration',
      session.user.id,
      session.workspace.id,
      session.revision,
    ],
    queryFn: ({ signal }) =>
      api.request('/configuration', configurationSchema, { signal }),
    select,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: false,
  })
}
export const selectRequestLimit = (configuration: BusinessConfiguration) =>
  configuration.limits.requestAmountMinor
export const selectAiEnabled = (configuration: BusinessConfiguration) =>
  configuration.features.aiSuggestions
