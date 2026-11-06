import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { useTheme } from '@/shared/theme/theme-context'
import { usePreferences } from '@/shared/preferences/store'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { ns } from '../messages'
import { Showcase } from './section'

const tokenGroups = [
  ['background', 'foreground', 'card', 'muted', 'muted-foreground', 'border'],
  ['primary', 'primary-foreground', 'secondary', 'accent', 'ring', 'input'],
  ['success', 'warning', 'info', 'destructive'],
  ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
] as const

export default function Foundations() {
  const { t } = useTranslation(ns)
  return (
    <div className="grid gap-6">
      <Showcase
        title={t('colors')}
        hint={t('colorsHint')}
        className="grid gap-6"
      >
        <Swatches />
      </Showcase>
      <Showcase
        title={t('typography')}
        hint={t('typographyHint')}
        className="grid gap-6"
      >
        <TypeScale />
      </Showcase>
      <div className="grid gap-6 lg:grid-cols-2">
        <Showcase
          title={t('radiusElevation')}
          hint={t('radiusElevationHint')}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {(
            [
              ['rounded-sm', 'shadow-xs'],
              ['rounded-md', 'shadow-sm'],
              ['rounded-lg', 'shadow-md'],
              ['rounded-xl', 'shadow-lg'],
            ] as const
          ).map(([radius, shadow]) => (
            <div key={radius} className="grid gap-2 text-center">
              <div className={`h-16 border bg-card ${radius} ${shadow}`} />
              <code
                dir="ltr"
                className="font-mono text-[0.6875rem] text-muted-foreground"
              >
                {radius}
                <br />
                {shadow}
              </code>
            </div>
          ))}
        </Showcase>
        <Showcase title={t('motion')} hint={t('motionHint')}>
          <Motion />
        </Showcase>
      </div>
    </div>
  )
}

function Swatches() {
  // Re-read computed values whenever theme or brand changes.
  const { resolvedTheme } = useTheme()
  const brand = usePreferences((state) => state.value.brand)
  const [values, setValues] = useState<Record<string, string>>({})
  useEffect(() => {
    // The theme provider applies classes in its own effect; read on the next frame.
    const frame = requestAnimationFrame(() => {
      const style = getComputedStyle(document.documentElement)
      setValues(
        Object.fromEntries(
          tokenGroups
            .flat()
            .map((token) => [
              token,
              style.getPropertyValue(`--${token}`).trim(),
            ]),
        ),
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [resolvedTheme, brand])
  return (
    <div className="grid gap-6">
      {tokenGroups.map((group) => (
        <div
          key={group[0]}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {group.map((token) => (
            <div key={token} className="grid gap-1.5">
              <div
                className="h-14 rounded-lg border shadow-xs"
                style={{ background: `var(--${token})` }}
              />
              <code dir="ltr" className="font-mono text-xs">
                --{token}
              </code>
              <span
                dir="ltr"
                className="font-mono text-[0.6875rem] text-muted-foreground uppercase"
              >
                {values[token]}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function TypeScale() {
  const { t } = useTranslation(ns)
  const scale = [
    ['h1', 'text-3xl font-semibold tracking-tight', '30 / 650'],
    ['h2', 'text-xl font-semibold', '20 / 600'],
    ['body', 'text-sm', '14 / 400'],
    ['small', 'text-xs text-muted-foreground', '12 / 400'],
  ] as const
  return (
    <div className="divide-y">
      {scale.map(([name, className, spec]) => (
        <div
          key={name}
          className="grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[6rem_1fr_1fr] md:items-baseline md:gap-6"
        >
          <code dir="ltr" className="font-mono text-xs text-muted-foreground">
            {name} · {spec}
          </code>
          <p lang="en" dir="ltr" className={className}>
            {t('sample')}
          </p>
          <p lang="ar" dir="rtl" className={className}>
            {t('sampleArabic')}
          </p>
        </div>
      ))}
    </div>
  )
}

function Motion() {
  const { t } = useTranslation(ns)
  const [run, setRun] = useState(0)
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-2">
          <div className="grid h-20 place-items-center rounded-lg border bg-muted/50">
            <div
              key={run}
              className="h-8 w-14 animate-page-in rounded-md bg-primary"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {t('motionPage')}
          </span>
        </div>
        <div className="grid gap-2">
          <div className="grid h-20 items-center overflow-hidden rounded-lg border bg-muted/50 px-3">
            <div className="h-1 overflow-hidden rounded-full bg-primary/15">
              <div className="h-full w-1/2 animate-progress rounded-full bg-primary" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {t('motionProgress')}
          </span>
        </div>
        <div className="grid gap-2">
          <div className="grid h-20 content-center gap-2 rounded-lg border bg-muted/50 px-3">
            <Skeleton className="h-3 w-full bg-foreground/10" />
            <Skeleton className="h-3 w-2/3 bg-foreground/10" />
          </div>
          <span className="text-xs text-muted-foreground">
            {t('motionSkeleton')}
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => setRun((value) => value + 1)}
      >
        <RotateCcw />
        {t('replay')}
      </Button>
    </div>
  )
}
