import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Printer } from 'lucide-react'
import { exportCsv } from '@/shared/export/csv'
import { ExportMenu } from '@/shared/export/export-menu'
import type { ExportDocument, ExportSheet } from '@/shared/export/model'
import { exportXlsx } from '@/shared/export/xlsx'
import { Button } from '@/shared/ui/button'
import { PrintDocument, PrintSection, PrintTable } from './print-document'
import { PrintPreview, type PrintOrientation } from './print-preview'

/**
 * Export and print for a report or list from one description of the data: Excel
 * and CSV files, and a PDF or paper copy through the print preview. The default
 * printed body renders each sheet as a `PrintTable`; pass `printBody` for a
 * designed layout such as a financial statement. Sheets are built on demand.
 */
export function ReportActions({
  document,
  sheets,
  printBody,
  orientation = 'portrait',
  disabled = false,
  size = 'default',
}: {
  document: ExportDocument
  sheets: () => ExportSheet<unknown>[]
  printBody?: ReactNode
  orientation?: PrintOrientation
  disabled?: boolean
  size?: 'sm' | 'default'
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2" data-print="hide">
      <Button
        variant="outline"
        size={size}
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label={t('print')}
      >
        <Printer data-icon="inline-start" />
        <span className="sr-only sm:not-sr-only">{t('print')}</span>
      </Button>
      <ExportMenu
        size={size}
        disabled={disabled}
        onPdf={() => setOpen(true)}
        onExport={async (kind) => {
          const built = sheets()
          if (kind === 'csv') exportCsv(document, built[0]!)
          else await exportXlsx(document, built)
        }}
      />
      {open && (
        <ReportPreview
          document={document}
          sheets={sheets}
          printBody={printBody}
          orientation={orientation}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

function ReportPreview({
  document,
  sheets,
  printBody,
  orientation,
  onClose,
}: {
  document: ExportDocument
  sheets: () => ExportSheet<unknown>[]
  printBody?: ReactNode
  orientation: PrintOrientation
  onClose: () => void
}) {
  const { t } = useTranslation()
  // Built once per opening; the preview and the printed copy share them.
  const [built] = useState(() => (printBody ? [] : sheets()))
  return (
    <PrintPreview
      open
      onOpenChange={(next) => !next && onClose()}
      title={document.title}
      orientation={orientation}
    >
      <PrintDocument
        title={document.title}
        subtitle={document.subtitle}
        details={document.details}
        note={t('amountsIn', { currency: document.currency })}
      >
        {printBody ??
          built.map((sheet) => (
            <PrintSection
              key={sheet.name}
              title={built.length > 1 ? sheet.name : undefined}
            >
              <PrintTable sheet={sheet} document={document} />
            </PrintSection>
          ))}
      </PrintDocument>
    </PrintPreview>
  )
}
