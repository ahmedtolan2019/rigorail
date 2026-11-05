import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { ThemeProvider } from './theme-provider'
import { useTheme } from './theme-context'

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
})

function ThemeControl() {
  const { resolvedTheme, setTheme } = useTheme()
  return <button onClick={() => setTheme('light')}>{resolvedTheme}</button>
}

test('ignores invalid stored values and persists a selected theme', () => {
  localStorage.setItem('vite-ui-theme', 'invalid theme')
  render(
    <ThemeProvider defaultTheme="dark">
      <ThemeControl />
    </ThemeProvider>,
  )
  expect(document.documentElement).toHaveClass('dark')
  fireEvent.click(screen.getByRole('button', { name: 'dark' }))
  expect(document.documentElement).toHaveClass('light')
  expect(localStorage.getItem('vite-ui-theme')).toBe('light')
})

test('theme remains usable when reading and writing storage throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  render(
    <ThemeProvider defaultTheme="dark">
      <ThemeControl />
    </ThemeProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'dark' }))
  expect(screen.getByRole('button', { name: 'light' })).toBeVisible()
})

test('missing provider is reported instead of silently doing nothing', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  expect(() => render(<ThemeControl />)).toThrow(
    'useTheme must be used within a ThemeProvider',
  )
})
