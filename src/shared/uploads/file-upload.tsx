import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  RotateCw,
  UploadCloud,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useServices } from '@/shared/api/services'
import { cn } from '@/shared/lib/utils'
import {
  Attachment as AttachmentItem,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/shared/ui/attachment'
import { Button } from '@/shared/ui/button'
import { formatBytes, type Attachment } from './model'

function fileIcon(type: string): LucideIcon {
  if (type.startsWith('image/')) return FileImage
  if (/sheet|excel|csv/.test(type)) return FileSpreadsheet
  return FileText
}
interface Pending {
  key: string
  file: File
  progress: number
  failed: boolean
  controller: AbortController
}

/**
 * Drag-and-drop or browse uploads with progress, cancel, retry and remove. Files go
 * to storage through `services.upload`; `onAdd` attaches the result to the record.
 * Client checks (`accept`, `maxSize`, `maxFiles`) are UX only; storage enforces.
 */
export function FileUpload({
  value,
  onAdd,
  onRemove,
  accept = [],
  acceptLabel,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  disabled = false,
  readOnly = false,
  label,
}: {
  value: readonly Attachment[]
  onAdd: (attachment: Attachment) => Promise<unknown> | void
  onRemove?: (attachment: Attachment) => void
  /** MIME types or extensions, for example `['application/pdf', 'image/*', '.xlsx']`. */
  accept?: string[]
  /** Plain-language summary of `accept` for the hint, for example "PDF or images". */
  acceptLabel?: string
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  /** Lists files only, for users who may not change them. */
  readOnly?: boolean
  /** Accessible name of the drop zone. */
  label: string
}) {
  const { t, i18n } = useTranslation()
  const { upload } = useServices()
  const input = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const [pending, setPending] = useState<Pending[]>([])
  const [over, setOver] = useState(false)
  const patch = (key: string, next: Partial<Pending>) =>
    setPending((list) =>
      list.map((item) => (item.key === key ? { ...item, ...next } : item)),
    )
  const drop = (key: string) =>
    setPending((list) => list.filter((item) => item.key !== key))

  async function start(item: Pending) {
    try {
      const attachment = await upload(item.file, {
        signal: item.controller.signal,
        onProgress: (progress) => patch(item.key, { progress }),
      })
      await onAdd(attachment)
      drop(item.key)
    } catch {
      if (!item.controller.signal.aborted) patch(item.key, { failed: true })
    }
  }
  function matches(file: File) {
    if (!accept.length) return true
    const name = file.name.toLowerCase()
    return accept.some((rule) =>
      rule.startsWith('.')
        ? name.endsWith(rule.toLowerCase())
        : rule.endsWith('/*')
          ? file.type.startsWith(rule.slice(0, -1))
          : file.type === rule,
    )
  }
  function add(files: FileList | null) {
    if (!files || disabled) return
    let room = maxFiles - value.length - pending.length
    for (const file of Array.from(files)) {
      if (!matches(file)) toast.error(t('uploadType', { name: file.name }))
      else if (file.size > maxSize)
        toast.error(
          t('uploadSize', {
            name: file.name,
            size: formatBytes(maxSize, i18n.language),
          }),
        )
      else if (room <= 0) toast.error(t('uploadCount', { count: maxFiles }))
      else {
        room--
        const item = {
          key: crypto.randomUUID(),
          file,
          progress: 0,
          failed: false,
          controller: new AbortController(),
        }
        setPending((list) => [...list, item])
        void start(item)
      }
    }
  }
  return (
    <div className="grid gap-3">
      {!readOnly && (
        <>
          <div
            role="group"
            data-print="hide"
            aria-label={label}
            aria-describedby={hintId}
            onDragOver={(event) => {
              event.preventDefault()
              if (!disabled) setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setOver(false)
              add(event.dataTransfer.files)
            }}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-5 text-center transition-colors',
              over ? 'border-primary bg-primary/5' : 'bg-muted/30',
              disabled && 'opacity-60',
            )}
          >
            <UploadCloud
              aria-hidden="true"
              className="size-6 text-muted-foreground"
            />
            <p className="text-sm">
              {t('uploadDrop')}{' '}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 align-baseline"
                disabled={disabled}
                onClick={() => input.current?.click()}
              >
                {t('uploadBrowse')}
              </Button>
            </p>
            <p id={hintId} className="text-xs text-muted-foreground">
              {t('uploadHint', {
                types:
                  acceptLabel ??
                  (accept.length ? accept.join(', ') : t('uploadAnyType')),
                size: formatBytes(maxSize, i18n.language),
              })}
            </p>
            <input
              ref={input}
              type="file"
              multiple
              hidden
              accept={accept.join(',')}
              aria-label={label}
              onChange={(event) => {
                add(event.target.files)
                event.target.value = ''
              }}
            />
          </div>
        </>
      )}
      {(value.length > 0 || pending.length > 0) && (
        <ul className="grid gap-2 sm:grid-cols-2 print:grid-cols-1" aria-label={label}>
          {value.map((item) => {
            const Icon = fileIcon(item.type)
            return (
              <li key={item.id}>
                <AttachmentItem className="w-full">
                  <AttachmentMedia>
                    <Icon />
                  </AttachmentMedia>
                  <AttachmentContent className="min-w-0 flex-1">
                    <AttachmentTitle dir="auto">{item.name}</AttachmentTitle>
                    <AttachmentDescription>
                      {formatBytes(item.size, i18n.language)}
                    </AttachmentDescription>
                  </AttachmentContent>
                  {onRemove && (
                    <AttachmentActions data-print="hide">
                      <AttachmentAction
                        aria-label={t('uploadRemove', { name: item.name })}
                        onClick={() => onRemove(item)}
                      >
                        <X />
                      </AttachmentAction>
                    </AttachmentActions>
                  )}
                </AttachmentItem>
              </li>
            )
          })}
          {pending.map((item) => {
            const Icon = fileIcon(item.file.type)
            const percent = Math.round(item.progress * 100)
            return (
              <li key={item.key}>
                <AttachmentItem
                  className="w-full"
                  state={item.failed ? 'error' : 'uploading'}
                >
                  <AttachmentMedia>
                    <Icon />
                  </AttachmentMedia>
                  <AttachmentContent className="min-w-0 flex-1 gap-1">
                    <AttachmentTitle dir="auto">
                      {item.file.name}
                    </AttachmentTitle>
                    {item.failed ? (
                      <AttachmentDescription className="text-destructive">
                        {t('uploadFailed')}
                      </AttachmentDescription>
                    ) : (
                      <div
                        role="progressbar"
                        aria-label={t('uploading', { name: item.file.name })}
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-200"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </AttachmentContent>
                  <AttachmentActions data-print="hide">
                    {item.failed && (
                      <AttachmentAction
                        aria-label={t('uploadRetry', { name: item.file.name })}
                        onClick={() => {
                          const retry = {
                            ...item,
                            failed: false,
                            progress: 0,
                            controller: new AbortController(),
                          }
                          patch(item.key, retry)
                          void start(retry)
                        }}
                      >
                        <RotateCw />
                      </AttachmentAction>
                    )}
                    <AttachmentAction
                      aria-label={t('uploadCancel', { name: item.file.name })}
                      onClick={() => {
                        item.controller.abort()
                        drop(item.key)
                      }}
                    >
                      <X />
                    </AttachmentAction>
                  </AttachmentActions>
                </AttachmentItem>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
