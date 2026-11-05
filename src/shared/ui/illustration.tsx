import { cn } from '@/shared/lib/utils'
import accessDenied from '@/shared/assets/illustrations/access-denied.webp'
import empty from '@/shared/assets/illustrations/empty.webp'
import error from '@/shared/assets/illustrations/error.webp'
import noResults from '@/shared/assets/illustrations/no-results.webp'
import notFound from '@/shared/assets/illustrations/not-found.webp'
import offline from '@/shared/assets/illustrations/offline.webp'
import workspace from '@/shared/assets/illustrations/workspace.webp'
import upload from '@/shared/assets/illustrations/upload.webp'
import welcome from '@/shared/assets/illustrations/welcome.webp'
import success from '@/shared/assets/illustrations/success.webp'
import download from '@/shared/assets/illustrations/download.webp'
import approvals from '@/shared/assets/illustrations/approvals.webp'
import documents from '@/shared/assets/illustrations/documents.webp'
import analytics from '@/shared/assets/illustrations/analytics.webp'
import team from '@/shared/assets/illustrations/team.webp'
import schedule from '@/shared/assets/illustrations/schedule.webp'
import integrations from '@/shared/assets/illustrations/integrations.webp'
import security from '@/shared/assets/illustrations/security.webp'
import archive from '@/shared/assets/illustrations/archive.webp'
import maintenance from '@/shared/assets/illustrations/maintenance.webp'
import billing from '@/shared/assets/illustrations/billing.webp'
import notifications from '@/shared/assets/illustrations/notifications.webp'
import growth from '@/shared/assets/illustrations/growth.webp'
import support from '@/shared/assets/illustrations/support.webp'

// Static imports resolve to hashed URLs only; each 7–23 KB WebP downloads when rendered.
const sources = {
  workspace,
  upload,
  welcome,
  success,
  download,
  approvals,
  documents,
  analytics,
  team,
  schedule,
  integrations,
  security,
  archive,
  maintenance,
  billing,
  notifications,
  growth,
  support,
  empty,
  'no-results': noResults,
  error,
  offline,
  'not-found': notFound,
  'access-denied': accessDenied,
}
export type IllustrationName = keyof typeof sources
export const illustrationNames = Object.keys(sources) as IllustrationName[]

/**
 * Decorative artwork: 400px transparent WebP in neutral slate.
 * Text beside it carries the meaning. Usage: docs/illustrations.md.
 */
function Illustration({
  name,
  className,
}: {
  name: IllustrationName
  className?: string
}) {
  return (
    <img
      src={sources[name]}
      alt=""
      aria-hidden="true"
      width={200}
      height={200}
      loading="lazy"
      decoding="async"
      draggable={false}
      data-illustration={name}
      className={cn(
        'size-32 animate-in object-contain duration-500 select-none fade-in-0 zoom-in-95 motion-reduce:animate-none sm:size-40 dark:opacity-85 dark:brightness-[0.82]',
        className,
      )}
    />
  )
}

export { Illustration }
