import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Printer, RectangleHorizontal, RectangleVertical } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

export type PrintOrientation = 'portrait' | 'landscape'

/**
 * Full-screen print preview. Shows the document on A4 paper in the chosen
 * orientation; "Print" opens the browser dialog, where "Save as PDF" produces a
 * searchable PDF with correct Arabic shaping. While open, printing outputs only
 * this document (see the print rules in `src/index.css`), so the page behind it
 * never leaks onto paper.
 */
export function PrintPreview({
  open,
  onOpenChange,
  title,
  orientation: initial = 'portrait',
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  orientation?: PrintOrientation
  /** A `PrintDocument`. */
  children: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const [orientation, setOrientation] = useState(initial)
  // Reset to the caller's default each time the preview opens.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setOrientation(initial)
  }
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.dataset.printing = orientation
    return () => {
      delete root.dataset.printing
    }
  }, [open, orientation])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="flex h-dvh max-h-none w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
        >
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-background px-4 py-3 sm:px-6">
            <div className="me-auto min-w-0">
              <DialogTitle className="truncate text-base">
                {t('printPreview')}
              </DialogTitle>
              <DialogDescription className="truncate text-xs">
                {title} · {t('printPdfHint')}
              </DialogDescription>
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={orientation}
              onValueChange={(value) =>
                value && setOrientation(value as PrintOrientation)
              }
              aria-label={t('orientation')}
            >
              <ToggleGroupItem value="portrait" aria-label={t('portrait')}>
                <RectangleVertical />
                <span className="hidden sm:inline">{t('portrait')}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="landscape" aria-label={t('landscape')}>
                <RectangleHorizontal />
                <span className="hidden sm:inline">{t('landscape')}</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('close')}
            </Button>
            <Button onClick={() => window.print()}>
              <Printer data-icon="inline-start" />
              {t('printOrSave')}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-muted/70 p-4 sm:p-8">
            <div
              data-paper
              dir={i18n.dir()}
              className={cn(
                'mx-auto rounded-sm shadow-lg ring-1 ring-black/5',
                orientation === 'portrait'
                  ? 'w-[210mm] min-h-[297mm] px-[12mm] py-[14mm]'
                  : 'w-[297mm] min-h-[210mm] px-[12mm] py-[12mm]',
              )}
            >
              {children}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {open &&
        createPortal(
          <div
            data-print-root
            data-paper
            data-orientation={orientation}
            dir={i18n.dir()}
            aria-hidden="true"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
