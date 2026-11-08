import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, FileText, FileType } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Spinner } from '@/shared/ui/spinner'

export type ExportKind = 'xlsx' | 'csv'

/**
 * Export button with format choice and progress/success/failure toasts. Pass
 * `onPdf` to offer a PDF, produced from the print preview (see `ReportActions`).
 */
export function ExportMenu({
  onExport,
  onPdf,
  disabled = false,
  formats = ['xlsx', 'csv'],
  size = 'default',
}: {
  onExport: (kind: ExportKind) => Promise<void>
  onPdf?: () => void
  disabled?: boolean
  formats?: ExportKind[]
  size?: 'sm' | 'default'
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const run = (kind: ExportKind) => {
    setBusy(true)
    const job = onExport(kind).finally(() => setBusy(false))
    toast.promise(job, {
      loading: t('exporting'),
      success: t('exported'),
      error: t('exportFailed'),
    })
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled || busy}
          aria-label={t('export')}
        >
          {busy ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Download data-icon="inline-start" />
          )}
          <span className="sr-only sm:not-sr-only">{t('export')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {formats.includes('xlsx') && (
          <DropdownMenuItem onClick={() => run('xlsx')}>
            <FileSpreadsheet />
            {t('exportExcel')}
          </DropdownMenuItem>
        )}
        {formats.includes('csv') && (
          <DropdownMenuItem onClick={() => run('csv')}>
            <FileText />
            {t('exportCsv')}
          </DropdownMenuItem>
        )}
        {onPdf && (
          <DropdownMenuItem onClick={onPdf}>
            <FileType />
            {t('exportPdf')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
