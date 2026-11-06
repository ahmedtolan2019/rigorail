import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Bell, Building2, ShieldCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { ns } from '../messages'

const sections: { id: string; icon: LucideIcon }[] = [
  { id: 'general', icon: Building2 },
  { id: 'notifications', icon: Bell },
  { id: 'security', icon: ShieldCheck },
]
interface Values {
  name: string
  timezone: string
  fiscal: string
  digest: boolean
  mentions: boolean
  twoFactor: boolean
  session: string
}
const initial: Values = {
  name: 'North workspace',
  timezone: 'Africa/Cairo',
  fiscal: 'january',
  digest: true,
  mentions: true,
  twoFactor: false,
  session: '24h',
}

export default function SettingsLayout() {
  const { t } = useTranslation(ns)
  const [active, setActive] = useState('general')
  const form = useForm<Values>({ defaultValues: initial })
  const dirty = form.formState.isDirty
  return (
    <form
      className="grid gap-6 md:grid-cols-[11rem_minmax(0,1fr)]"
      onSubmit={form.handleSubmit((values) => {
        form.reset(values)
        toast.success(t('saved'))
      })}
    >
      <nav
        aria-label={t('settings')}
        className="md:sticky md:top-20 md:self-start"
      >
        <ul className="flex gap-1 overflow-x-auto md:flex-col">
          {sections.map(({ id, icon: Icon }) => (
            <li key={id}>
              <a
                href={`#settings-${id}`}
                onClick={() => setActive(id)}
                aria-current={active === id ? 'true' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                  active === id && 'bg-accent font-medium text-foreground',
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {t(id)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="grid min-w-0 gap-6">
        <Section id="general" title={t('general')}>
          <Row
            label={t('workspaceName')}
            hint={t('workspaceNameHint')}
            htmlFor="settings-name"
          >
            <Input
              id="settings-name"
              className="sm:w-64"
              dir="auto"
              {...form.register('name')}
            />
          </Row>
          <Row label={t('timezone')} htmlFor="settings-timezone">
            <Controller
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="settings-timezone"
                    className="w-full sm:w-64"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'Africa/Cairo',
                      'Asia/Riyadh',
                      'Asia/Dubai',
                      'Europe/London',
                      'America/New_York',
                    ].map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        <span dir="ltr">{zone.replace('_', ' ')}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Row>
          <Row label={t('fiscalYear')} htmlFor="settings-fiscal">
            <Controller
              control={form.control}
              name="fiscal"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="settings-fiscal"
                    className="w-full sm:w-64"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['january', 'april', 'july'].map((month) => (
                      <SelectItem key={month} value={month}>
                        {t(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Row>
        </Section>
        <Section id="notifications" title={t('notifications')}>
          {(['digest', 'mentions'] as const).map((name) => (
            <Row
              key={name}
              label={t(name === 'digest' ? 'emailDigest' : 'mentions')}
              hint={t(name === 'digest' ? 'emailDigestHint' : 'mentionsHint')}
              htmlFor={`settings-${name}`}
            >
              <Controller
                control={form.control}
                name={name}
                render={({ field }) => (
                  <Switch
                    id={`settings-${name}`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Row>
          ))}
        </Section>
        <Section id="security" title={t('security')}>
          <Row
            label={t('twoFactor')}
            hint={t('twoFactorHint')}
            htmlFor="settings-2fa"
          >
            <Controller
              control={form.control}
              name="twoFactor"
              render={({ field }) => (
                <Switch
                  id="settings-2fa"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </Row>
          <Row label={t('sessionLength')} htmlFor="settings-session">
            <Controller
              control={form.control}
              name="session"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="settings-session"
                    className="w-full sm:w-44"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8h">{t('hours8')}</SelectItem>
                    <SelectItem value="24h">{t('hours24')}</SelectItem>
                    <SelectItem value="7d">{t('days7')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Row>
        </Section>
        {/* Appears only with changes; sticky so it is reachable from any section. */}
        {dirty && (
          <div
            role="region"
            aria-label={t('unsaved')}
            className="sticky bottom-4 z-10 flex animate-in items-center justify-between gap-3 rounded-xl border bg-popover p-3 ps-4 shadow-lg duration-200 fade-in-0 slide-in-from-bottom-4"
          >
            <span className="flex items-center gap-2 text-sm">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-warning"
              />
              {t('unsaved')}
            </span>
            <span className="flex gap-2">
              <ConfirmAction
                title={t('discardTitle')}
                description={t('discardHint')}
                confirmLabel={t('discard')}
                tone="destructive"
                onConfirm={() => form.reset()}
              >
                <Button type="button" variant="ghost" size="sm">
                  {t('discard')}
                </Button>
              </ConfirmAction>
              <Button type="submit" size="sm">
                {t('save')}
              </Button>
            </span>
          </div>
        )}
      </div>
    </form>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <Card id={`settings-${id}`} className="scroll-mt-20 gap-0 divide-y py-0">
      <h3 className="px-5 py-3.5 text-sm font-semibold">{title}</h3>
      {children}
    </Card>
  )
}

function Row({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="font-medium">
          {label}
        </Label>
        {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
