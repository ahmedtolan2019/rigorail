// Pure date helpers shared by pickers and route loaders; no UI imports.
/** ISO calendar date (yyyy-mm-dd) in local time, for URLs and API queries. */
export function toIsoDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
export function fromIsoDate(value: string | undefined) {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}
const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())
const daysAgo = (days: number) => {
  const date = startOfDay(new Date())
  date.setDate(date.getDate() - days)
  return date
}
const today = () => startOfDay(new Date())
/** Date math for common reporting presets, usable outside React (route loaders). */
export const presetRanges = {
  '7d': () => ({ from: daysAgo(6), to: today() }),
  '30d': () => ({ from: daysAgo(29), to: today() }),
  '90d': () => ({ from: daysAgo(89), to: today() }),
  mtd: () => {
    const now = today()
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
  },
  qtd: () => {
    const now = today()
    return {
      from: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
      to: now,
    }
  },
  ytd: () => {
    const now = today()
    return { from: new Date(now.getFullYear(), 0, 1), to: now }
  },
  '12m': () => ({ from: daysAgo(364), to: today() }),
} satisfies Record<string, () => { from: Date; to: Date }>
export type PresetId = keyof typeof presetRanges
export const presetKeys: Record<PresetId, string> = {
  '7d': 'preset7d',
  '30d': 'preset30d',
  '90d': 'preset90d',
  mtd: 'presetMtd',
  qtd: 'presetQtd',
  ytd: 'presetYtd',
  '12m': 'preset12m',
}
