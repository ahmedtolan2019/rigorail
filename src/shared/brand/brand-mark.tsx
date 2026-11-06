import { cn } from '@/shared/lib/utils'
import { getBrand, RIGORAIL_MARK_PATH } from './brand'

/**
 * The application's logo tile: the configured logo image, or the default mark
 * in white on the brand color. Decorative; pair it with the visible app name.
 */
export function BrandMark({ className }: { className?: string }) {
  const { logoUrl } = getBrand()
  if (logoUrl)
    return (
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        className={cn('size-8 shrink-0 rounded-lg object-contain', className)}
      />
    )
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm',
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-[62%]" focusable="false">
        <path fill="currentColor" fillRule="evenodd" d={RIGORAIL_MARK_PATH} />
      </svg>
    </span>
  )
}
