import { act, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import i18n from '../i18n'
import { Calendar } from './calendar'
import { Pagination, PaginationNext, PaginationPrevious } from './pagination'
import { DirectionProvider } from './direction'

test('calendar and pagination follow Arabic locale and reading direction', async () => {
  await act(async () => {
    await i18n.changeLanguage('ar')
  })
  const view = render(
    <DirectionProvider dir="rtl">
      <Calendar defaultMonth={new Date(2026, 10, 1)} />
      <Pagination>
        <PaginationPrevious href="#previous" />
        <PaginationNext href="#next" />
      </Pagination>
    </DirectionProvider>,
  )
  expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  expect(view.container.querySelector('[dir="rtl"]')).not.toBeNull()
  expect(screen.getByRole('link', { name: 'التالي' })).toBeVisible()
  expect(screen.getByRole('link', { name: 'السابق' })).toBeVisible()
  await act(async () => {
    await i18n.changeLanguage('en')
  })
  expect(document.documentElement).toHaveAttribute('dir', 'ltr')
  expect(screen.getByRole('link', { name: 'Next' })).toBeVisible()
})
