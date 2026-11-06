import { createContext, useContext } from 'react'
import type { Uploader } from '../uploads/model'
import type { ApiClient } from './client'
import type {
  AuthorizationAdapter,
  PermissionDefinition,
  Session,
} from '../auth/model'
export interface Services {
  api: ApiClient
  session: Session
  access: AuthorizationAdapter
  catalog: readonly PermissionDefinition[]
  mode: 'demo' | 'api'
  aiEnabled: boolean
  refreshSession: () => Promise<unknown>
  /** Sends a file to storage; see `shared/uploads/model.ts`. */
  upload: Uploader
  /** Ends the session with the backend and shows the sign-in screen. */
  signOut: () => Promise<void>
  demo?: {
    plan: string
    setPlan: (value: string) => void
    requestsEnabled: boolean
    setRequestsEnabled: (value: boolean) => void
    persona: string
    setPersona: (value: string) => void
    workspace: string
    setWorkspace: (value: string) => void
  }
}
export const ServicesContext = createContext<Services | null>(null)
export function useServices() {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('Application services are missing.')
  return services
}
