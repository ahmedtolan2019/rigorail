import { render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { Slider } from './slider'

// jsdom has no layout observer; these tests assert accessible names, not sizing.
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

test('the keyboard-focusable thumb receives the visible label and description', () => {
  render(
    <>
      <span id="capacity-label">Team capacity</span>
      <p id="capacity-hint">Hours per week</p>
      <Slider
        value={[24]}
        aria-labelledby="capacity-label"
        aria-describedby="capacity-hint"
      />
    </>,
  )
  const thumb = screen.getByRole('slider', { name: 'Team capacity' })
  expect(thumb).toHaveAccessibleDescription('Hours per week')
  expect(thumb).toHaveAttribute('aria-valuenow', '24')
})

test('range thumbs can have distinct accessible names', () => {
  render(
    <Slider
      value={[10, 80]}
      thumbLabels={['Minimum amount', 'Maximum amount']}
    />,
  )
  expect(
    screen.getByRole('slider', { name: 'Minimum amount' }),
  ).toHaveAttribute('aria-valuenow', '10')
  expect(
    screen.getByRole('slider', { name: 'Maximum amount' }),
  ).toHaveAttribute('aria-valuenow', '80')
})
