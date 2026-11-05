import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Languages,
  Monitor,
  Moon,
  PanelLeft,
  PanelTop,
  Rows2,
  Rows4,
  RotateCcw,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { usePreferences, type Preferences } from '@/shared/preferences/store'
import { useTheme, type Theme } from '@/shared/theme/theme-context'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ns } from './i18n'

const brands = { teal: '#0b7a73', indigo: '#4f46e5' } as const

export default function Appearance() {
  const { t, i18n } = useTranslation(ns),
    { theme, setTheme } = useTheme()
  const value = usePreferences((state) => state.value),
    set = usePreferences((state) => state.set),
    reset = usePreferences((state) => state.reset)
  return (
    // Settings pages constrain header and content together so actions align.
    <div className="max-w-3xl">
      <PageHeader
        title={t('navigation')}
        description={t('appearanceSubtitle')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset()
              setTheme('light')
            }}
          >
            <RotateCcw data-icon="inline-start" />
            {t('resetPreferences')}
          </Button>
        }
      />
      <Card className="gap-0 divide-y py-0">
        <Setting title={t('theme')} hint={t('themeHint')}>
          {(labelledBy) => (
            <Segmented
              labelledBy={labelledBy}
              value={theme}
              onChange={(next) => setTheme(next as Theme)}
              options={[
                { value: 'light', label: t('light'), icon: Sun },
                { value: 'dark', label: t('dark'), icon: Moon },
                { value: 'system', label: t('system'), icon: Monitor },
              ]}
            />
          )}
        </Setting>
        <Setting title={t('brand')} hint={t('brandHint')}>
          {(labelledBy) => (
            <Segmented
              labelledBy={labelledBy}
              value={value.brand}
              onChange={(brand) => set({ brand } as Partial<Preferences>)}
              options={(Object.keys(brands) as (keyof typeof brands)[]).map(
                (brand) => ({
                  value: brand,
                  label: t(brand),
                  swatch: brands[brand],
                }),
              )}
            />
          )}
        </Setting>
        <Setting title={t('density')} hint={t('densityHint')}>
          {(labelledBy) => (
            <Segmented
              labelledBy={labelledBy}
              value={value.density}
              onChange={(density) => set({ density } as Partial<Preferences>)}
              options={[
                { value: 'comfortable', label: t('comfortable'), icon: Rows2 },
                { value: 'compact', label: t('compact'), icon: Rows4 },
              ]}
            />
          )}
        </Setting>
        <Setting title={t('shell')} hint={t('shellHint')}>
          {(labelledBy) => (
            <Segmented
              labelledBy={labelledBy}
              value={value.shell}
              onChange={(shell) => set({ shell } as Partial<Preferences>)}
              options={[
                { value: 'sidebar', label: t('sidebar'), icon: PanelLeft },
                { value: 'topbar', label: t('topbar'), icon: PanelTop },
              ]}
            />
          )}
        </Setting>
        <Setting title={t('language')} hint={t('previewHint')}>
          {(labelledBy) => (
            <Segmented
              labelledBy={labelledBy}
              value={i18n.language}
              onChange={(language) => void i18n.changeLanguage(language)}
              options={[
                { value: 'en', label: 'English', icon: Languages, lang: 'en' },
                { value: 'ar', label: 'العربية', lang: 'ar' },
              ]}
            />
          )}
        </Setting>
      </Card>
    </div>
  )
}

function Setting({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: (labelledBy: string) => ReactNode
}) {
  const id = useId()
  return (
    <section className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:px-6">
      <div className="min-w-0">
        <h2 id={id} className="text-sm font-medium">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>
      {children(id)}
    </section>
  )
}

/** Single-choice segmented control; Radix renders it as an accessible radio group. */
function Segmented({
  labelledBy,
  value,
  onChange,
  options,
}: {
  labelledBy: string
  value: string
  onChange: (value: string) => void
  options: {
    value: string
    label: string
    icon?: LucideIcon
    swatch?: string
    lang?: string
  }[]
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-labelledby={labelledBy}
      value={value}
      // Radix emits "" when the active item is clicked again; keep a value selected.
      onValueChange={(next) => next && onChange(next)}
      className="w-full justify-start sm:w-auto"
    >
      {options.map(({ value: option, label, icon: Icon, swatch, lang }) => (
        <ToggleGroupItem
          key={option}
          value={option}
          lang={lang}
          className="flex-1 gap-1.5 px-3 data-[state=on]:bg-accent data-[state=on]:font-medium sm:flex-none"
        >
          {Icon && <Icon aria-hidden="true" />}
          {swatch && (
            <span
              aria-hidden="true"
              className="size-3 rounded-full ring-1 ring-black/10"
              style={{ background: swatch }}
            />
          )}
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
