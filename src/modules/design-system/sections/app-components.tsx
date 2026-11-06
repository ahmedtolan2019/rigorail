import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CheckCheck, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Attachment } from '@/shared/uploads/model'
import { FileUpload } from '@/shared/uploads/file-upload'
import { Button } from '@/shared/ui/button'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import {
  DateRangePicker,
  standardPresets,
  type DateRangeValue,
} from '@/shared/ui/date-range-picker'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import { ns } from '../messages'
import { Showcase } from './section'

/** Names the file to import, so copying starts from the shared source. */
function Source({ path }: { path: string }) {
  return (
    <code
      dir="ltr"
      className="w-fit rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
    >
      {path}
    </code>
  )
}

function Example({
  title,
  path,
  children,
}: {
  title: string
  path: string
  children: ReactNode
}) {
  return (
    <section className="grid content-start gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Source path={path} />
      </div>
      {children}
    </section>
  )
}

const tints = [
  ['success', 'bg-success/12 text-success', 'bg-success'],
  ['warning', 'bg-warning/12 text-warning', 'bg-warning'],
  ['info', 'bg-info/12 text-info', 'bg-info'],
  ['destructive', 'bg-destructive/10 text-destructive', 'bg-destructive'],
] as const

/**
 * Application-level components built on the primitives above. Product screens use
 * these instead of rebuilding confirmations, uploads, date filters or status chips.
 */
export function ApplicationComponents() {
  const { t } = useTranslation(ns)
  const [files, setFiles] = useState<Attachment[]>([])
  const [range, setRange] = useState<DateRangeValue>({})
  return (
    <Showcase
      title={t('appComponents')}
      hint={t('appComponentsHint')}
      className="grid gap-8 lg:grid-cols-2"
    >
      <Example title={t('confirmations')} path="@/shared/ui/confirm-action">
        <p className="text-sm text-muted-foreground">
          {t('confirmationsHint')}
        </p>
        <div className="flex flex-wrap gap-2">
          <ConfirmAction
            icon={CheckCheck}
            title={t('confirmApproveTitle')}
            description={t('confirmApproveHint')}
            chips={['REQ-1239', 'REQ-1230', 'REQ-1212']}
            details={[[t('confirmTotal'), <bdi key="total">$21,620.50</bdi>]]}
            confirmLabel={t('confirmApprove')}
            onConfirm={() => toast.success(t('confirmApproveDone'))}
          >
            <Button variant="outline">{t('confirmApprove')}</Button>
          </ConfirmAction>
          <ConfirmAction
            tone="destructive"
            icon={Trash2}
            irreversible
            title={t('confirmDeleteTitle')}
            description={t('confirmDeleteHint')}
            confirmLabel={t('confirmDelete')}
            onConfirm={() => toast(t('confirmDeleteDone'))}
          >
            <Button variant="outline" className="text-destructive">
              {t('confirmDelete')}
            </Button>
          </ConfirmAction>
        </div>
      </Example>

      <Example title={t('dateRange')} path="@/shared/ui/date-range-picker">
        <p className="text-sm text-muted-foreground">{t('dateRangeHint')}</p>
        <DateRangePicker
          value={range}
          onChange={setRange}
          presets={standardPresets((key) => t(key))}
          placeholder={t('dateRangePlaceholder')}
          allowClear
          className="w-fit"
        />
      </Example>

      <Example title={t('uploads')} path="@/shared/uploads/file-upload">
        <FileUpload
          label={t('uploads')}
          value={files}
          accept={['application/pdf', 'image/*']}
          acceptLabel={t('uploadsTypes')}
          maxFiles={3}
          onAdd={(file) => setFiles((list) => [...list, file])}
          onRemove={(file) =>
            setFiles((list) => list.filter((item) => item.id !== file.id))
          }
        />
      </Example>

      <Example title={t('statusTints')} path="text-success on bg-success/12">
        <p className="text-sm text-muted-foreground">{t('statusTintsHint')}</p>
        <div className="flex flex-wrap gap-2">
          {tints.map(([name, chip, dot]) => (
            <span
              key={name}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                chip,
              )}
            >
              <i
                aria-hidden="true"
                className={cn('size-1.5 rounded-full', dot)}
              />
              {t(`tint_${name}`)}
            </span>
          ))}
        </div>
      </Example>

      <Example title={t('shortcutKeys')} path="@/shared/shortcuts/registry">
        <p className="text-sm text-muted-foreground">{t('shortcutKeysHint')}</p>
        <dl className="grid w-fit grid-cols-[auto_auto] items-center gap-x-6 gap-y-2 text-sm">
          <dt>{t('common:shortcutSearch')}</dt>
          <dd>
            <KbdGroup dir="ltr">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </dd>
          <dt>{t('common:shortcutHelp')}</dt>
          <dd>
            <Kbd dir="ltr">?</Kbd>
          </dd>
        </dl>
      </Example>
    </Showcase>
  )
}
