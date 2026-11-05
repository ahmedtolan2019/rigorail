import { useTranslation } from 'react-i18next'
import { usePreferences, type Preferences } from '@/shared/preferences/store'
import { useTheme, type Theme } from '@/shared/theme/theme-context'
import { Field, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { Button } from '@/shared/ui/button'
export default function Appearance() {
  const { t, i18n } = useTranslation(),
    { theme, setTheme } = useTheme()
  const value = usePreferences((state) => state.value),
    set = usePreferences((state) => state.set),
    reset = usePreferences((state) => state.reset)
  const choices = [
    { key: 'brand', values: ['teal', 'indigo'] },
    { key: 'density', values: ['comfortable', 'compact'] },
    { key: 'shell', values: ['sidebar', 'topbar'] },
  ] as const
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t('appearance')}</h1>
          <p>{t('appearanceSubtitle')}</p>
        </div>
      </div>
      <section className="settings-form">
        <FieldGroup>
          {choices.map((choice) => (
            <Field key={choice.key}>
              <FieldLabel htmlFor={choice.key}>{t(choice.key)}</FieldLabel>
              <NativeSelect
                id={choice.key}
                value={value[choice.key]}
                onChange={(event) =>
                  set({
                    [choice.key]: event.target.value,
                  } as Partial<Preferences>)
                }
              >
                {choice.values.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {t(option)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          ))}
          <Field>
            <FieldLabel htmlFor="theme">{t('theme')}</FieldLabel>
            <NativeSelect
              id="theme"
              value={theme}
              onChange={(event) => setTheme(event.target.value as Theme)}
            >
              {(['light', 'dark', 'system'] as const).map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {t(option)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="language">{t('language')}</FieldLabel>
            <NativeSelect
              id="language"
              value={i18n.language}
              onChange={(event) => void i18n.changeLanguage(event.target.value)}
            >
              <NativeSelectOption value="en">English</NativeSelectOption>
              <NativeSelectOption value="ar">العربية</NativeSelectOption>
            </NativeSelect>
          </Field>
        </FieldGroup>
        <p className="muted">{t('previewHint')}</p>
        <Button
          variant="outline"
          onClick={() => {
            reset()
            setTheme('light')
          }}
        >
          {t('resetPreferences')}
        </Button>
      </section>
    </>
  )
}
