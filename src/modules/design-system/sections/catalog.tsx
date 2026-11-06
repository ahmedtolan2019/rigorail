import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { ExternalLink } from 'lucide-react'
import { Illustration } from '@/shared/ui/illustration'
import { DataTable } from '@/shared/data-table/data-table'
import { DataTableSearch } from '@/shared/data-table/search-input'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty'
import components from '../components.json'
import { ns } from '../messages'

type Entry = (typeof components)[number]

export default function Catalog() {
  const { t } = useTranslation(ns)
  const [search, setSearch] = useState('')
  const columns = useMemo<ColumnDef<Entry>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('componentName'),
        cell: ({ row }) => (
          <span className="grid gap-0.5">
            <span className="font-medium">{row.original.name}</span>
            <code
              dir="ltr"
              translate="no"
              className="max-w-md truncate font-mono text-xs text-muted-foreground"
            >
              {row.original.exports.join(', ')}
            </code>
          </span>
        ),
      },
      {
        accessorKey: 'path',
        header: t('source'),
        cell: ({ getValue }) => (
          <code dir="ltr" translate="no" className="font-mono text-xs">
            {getValue<string>()}
          </code>
        ),
      },
      {
        id: 'docs',
        header: t('documentation'),
        cell: ({ row }) => (
          <a
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            href={row.original.docs}
            target="_blank"
            rel="noreferrer"
          >
            {t('documentation')}
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        ),
      },
    ],
    [t],
  )
  const table = useReactTable({
    data: components,
    columns,
    state: { globalFilter: search },
    globalFilterFn: (row, _, value: string) =>
      `${row.original.name} ${row.original.exports.join(' ')}`
        .toLowerCase()
        .includes(value.toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm text-muted-foreground">
          {t('catalogHint')}
        </p>
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder={t('searchComponents')}
          delay={100}
          className="w-full sm:w-72"
        />
      </div>
      <DataTable
        table={table}
        caption={t('catalog')}
        empty={
          <Empty className="border-0 py-12">
            <EmptyHeader>
              <EmptyMedia>
                <Illustration name="no-results" />
              </EmptyMedia>
              <EmptyTitle>{t('noResults')}</EmptyTitle>
              <EmptyDescription>{t('common:noMatchesHint')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
    </div>
  )
}
