import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Languages, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme } from '@/shared/theme/theme-context'
import type { NavigationEntry } from '@/shared/routing/module'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/ui/command'
import { navigation, useVisible } from './navigation'

const matches = (label: string, query: string) =>
  label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())

/**
 * Filtering is owned here (not by cmdk) so text typed or pasted the instant the
 * dialog opens is applied to every item, including ones gated by async access.
 */
export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const [query, setQuery] = useState('')
  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) setQuery('')
  }
  const run = (action: () => void) => {
    close(false)
    action()
  }
  const preferences: {
    id: string
    label: string
    icon: LucideIcon
    action: () => void
  }[] = [
    {
      id: 'theme',
      label: t(resolvedTheme === 'dark' ? 'switchToLight' : 'switchToDark'),
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'language',
      label: i18n.language === 'ar' ? 'English' : 'العربية',
      icon: Languages,
      action: () =>
        void i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar'),
    },
  ].filter((item) => matches(item.label, query))
  return (
    <CommandDialog open={open} onOpenChange={close} shouldFilter={false}>
      <CommandInput
        placeholder={t('commandPlaceholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{t('commandEmpty')}</CommandEmpty>
        <CommandGroup heading={t('commandNavigate')}>
          {navigation.map((entry) => (
            <NavigationCommand
              key={entry.labelKey}
              entry={entry}
              query={query}
              onSelect={run}
            />
          ))}
        </CommandGroup>
        {preferences.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('commandPreferences')}>
              {preferences.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => run(item.action)}
                >
                  <item.icon />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

function NavigationCommand({
  entry,
  query,
  onSelect,
}: {
  entry: NavigationEntry
  query: string
  onSelect: (action: () => void) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const Icon = entry.icon
  const label = t(entry.labelKey)
  if (!useVisible(entry) || !matches(label, query)) return null
  return (
    <CommandItem
      value={entry.labelKey}
      onSelect={() => onSelect(() => void navigate(entry.link))}
    >
      <Icon />
      {label}
    </CommandItem>
  )
}
