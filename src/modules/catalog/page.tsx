import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/ui/input'
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/shared/ui/table'
import components from './components.json'
export default function Catalog() {
  const { t } = useTranslation(),
    [search, setSearch] = useState('')
  const results = components.filter((item) =>
    `${item.name} ${item.exports.join(' ')}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t('components')}</h1>
          <p>{t('catalogSubtitle')}</p>
        </div>
      </div>
      <p className="muted">{t('catalogHint')}</p>
      <Input
        className="my-6 max-w-lg"
        aria-label={t('searchComponents')}
        placeholder={t('searchComponents')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="data-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('componentName')}</TableHead>
              <TableHead>{t('source')}</TableHead>
              <TableHead>{t('documentation')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>{t('noResults')}</TableCell>
              </TableRow>
            )}
            {results.map((item) => (
              <TableRow key={item.name}>
                <TableCell>
                  <strong>{item.name}</strong>
                  <small className="permission-code" dir="ltr" translate="no">
                    {item.exports.join(', ')}
                  </small>
                </TableCell>
                <TableCell>
                  <code dir="ltr" translate="no">
                    {item.path}
                  </code>
                </TableCell>
                <TableCell>
                  <a
                    className="back-link"
                    href={item.docs}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('documentation')}
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
