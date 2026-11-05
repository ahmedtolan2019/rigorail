import { lazy } from 'react'
import type { ModuleDefinition } from '@/shared/routing/module'
import { ns } from './i18n'
export { accountRoutes } from './routes'
export { signOutRequest } from './sign-out'
export { safeRedirect } from './paths'
export type { SignedOutProps } from './signed-out/app'
export type { AccountSession } from './schema'

/** The signed-out experience. Lazy, so signed-in users never download it. */
export const SignedOutApp = lazy(() => import('./signed-out/app'))

/** Contract schemas for adapters such as the demo identity backend, loaded on demand. */
export const loadAccountContract = () => import('./schema')

// Reached from the account menu, so it has no sidebar entry.
export const accountModule = { id: ns } satisfies ModuleDefinition
