import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

/**
 * Search box that commits after the user pauses typing (or presses Enter), so each
 * keystroke does not trigger a request. External changes (back/forward) win.
 */
export function DataTableSearch({
  value,
  onChange,
  placeholder,
  delay = 300,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  delay?: number
  className?: string
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value)
  const [committed, setCommitted] = useState(value)
  const latest = useRef(onChange)
  useEffect(() => {
    latest.current = onChange
  })
  // Adopt URL changes made elsewhere, such as browser history navigation.
  if (value !== committed) {
    setCommitted(value)
    setDraft(value)
  }
  useEffect(() => {
    if (draft === committed) return
    const timer = setTimeout(() => latest.current(draft.trim()), delay)
    return () => clearTimeout(timer)
  }, [draft, committed, delay])
  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        role="searchbox"
        aria-label={placeholder}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onChange(draft.trim())
          if (event.key === 'Escape' && draft) setDraft('')
        }}
        className="h-9 ps-8 pe-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('clearSearch')}
          className="absolute end-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
          onClick={() => {
            setDraft('')
            onChange('')
          }}
        >
          <X />
        </Button>
      )}
    </div>
  )
}
