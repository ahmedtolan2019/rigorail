import { useState } from 'react'
import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTableSearch } from '@/shared/data-table/search-input'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/shared/ui/empty'
import {
  Illustration,
  illustrationNames,
  type IllustrationName,
} from '@/shared/ui/illustration'
import { ns } from '../illustration-messages'

export default function Illustrations() {
  const { t, i18n } = useTranslation(ns)
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState<{
    name: IllustrationName
    failed: boolean
  } | null>(null)
  const query = search.toLocaleLowerCase(i18n.language)
  const visible = illustrationNames
    .filter((name) =>
      `${name} ${t(`${name}Name`)} ${t(`${name}Hint`)}`
        .toLocaleLowerCase(i18n.language)
        .includes(query),
    )
    .sort((a, b) => t(`${a}Name`).localeCompare(t(`${b}Name`), i18n.language))

  async function copy(name: IllustrationName) {
    try {
      await navigator.clipboard.writeText(`<Illustration name="${name}" />`)
      setFeedback({ name, failed: false })
    } catch {
      setFeedback({ name, failed: true })
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-2">
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('hint')}</p>
        </div>
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder={t('search')}
          delay={100}
          className="w-full lg:w-80 lg:shrink-0"
        />
      </div>
      <div className="flex min-h-6 flex-wrap items-center gap-3">
        <Badge variant="secondary">
          {t('count', { count: visible.length })}
        </Badge>
        <p role="status" className="text-sm text-muted-foreground">
          {feedback &&
            t(feedback.failed ? 'copyFailed' : 'copied', {
              name: t(`${feedback.name}Name`),
            })}
        </p>
      </div>
      {visible.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((name) => (
            <article
              key={name}
              data-illustration-card={name}
              className="flex min-w-0 flex-col rounded-xl border bg-card p-4 text-card-foreground"
            >
              <div className="flex h-48 items-center justify-center rounded-lg bg-muted/30">
                <Illustration name={name} className="size-44 sm:size-44" />
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <h3 className="font-semibold">{t(`${name}Name`)}</h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('copy', { name: t(`${name}Name`) })}
                  onClick={() => void copy(name)}
                >
                  <Copy aria-hidden="true" />
                </Button>
              </div>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                {t(`${name}Hint`)}
              </p>
              <code
                dir="ltr"
                translate="no"
                className="mt-auto block rounded-md bg-muted/50 p-2 text-start font-mono text-xs break-all select-text"
              >{`<Illustration name="${name}" />`}</code>
            </article>
          ))}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <Illustration name="no-results" />
            <EmptyTitle>{t('noResults')}</EmptyTitle>
            <EmptyDescription>{t('tryAgain')}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => setSearch('')}>
            {t('clearSearch', { ns: 'common' })}
          </Button>
        </Empty>
      )}
    </div>
  )
}
