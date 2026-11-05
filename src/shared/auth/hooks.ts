import { useServices } from '../api/services'
import type { Resource } from './model'
export function useAccess(action: string, resource?: Resource) {
  return useServices().access.decide(action, resource)
}
