import { expect, test, vi } from 'vitest'
import { configureAnalytics, track } from './analytics'
import { release } from './release'

test('events carry the release and a failing sink never throws', () => {
  const sink = vi.fn()
  configureAnalytics(sink)
  track('request_submitted', { amount_band: 'large' })
  expect(sink).toHaveBeenCalledWith('request_submitted', {
    amount_band: 'large',
    // CI sets VITE_APP_RELEASE to the commit, so compare with the live value.
    release,
  })
  configureAnalytics(() => {
    throw new Error('down')
  })
  expect(() => track('anything')).not.toThrow()
})
