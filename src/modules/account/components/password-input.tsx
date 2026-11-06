import { useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/shared/ui/input-group'
import { ns } from '../messages'
import { PASSWORD_MIN, passwordRules } from '../schema'

/** Password field with a reveal toggle. Passwords are always left-to-right. */
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof InputGroupInput>, 'type'>) {
  const { t } = useTranslation(ns)
  const [visible, setVisible] = useState(false)
  return (
    <InputGroup className={className}>
      <InputGroupInput
        {...props}
        dir="ltr"
        type={visible ? 'text' : 'password'}
        spellCheck={false}
        autoCapitalize="none"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={t(visible ? 'hidePassword' : 'showPassword')}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

/** Live checklist for the password policy hint. The backend enforces the policy. */
export function PasswordRules({ value, id }: { value: string; id?: string }) {
  const { t } = useTranslation(ns)
  return (
    <ul id={id} aria-label={t('passwordRules')} className="grid gap-1 text-xs">
      {passwordRules.map((rule) => {
        const met = rule.test(value)
        return (
          <li
            key={rule.key}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              met ? 'text-success' : 'text-muted-foreground',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid size-3.5 place-items-center rounded-full border transition-colors',
                met
                  ? 'border-success bg-success text-background'
                  : 'border-current',
              )}
            >
              {met && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            {t(rule.key, { count: PASSWORD_MIN })}
            <span className="sr-only">{met ? '✓' : ''}</span>
          </li>
        )
      })}
    </ul>
  )
}
