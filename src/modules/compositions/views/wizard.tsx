import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Pencil } from 'lucide-react'
import { getCurrency, money, normalizeNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card'
import { Combobox } from '@/shared/ui/combobox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/shared/ui/input-group'
import { Spinner } from '@/shared/ui/spinner'
import { Textarea } from '@/shared/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ns } from '../messages'

const schema = z.object({
  name: z.string().trim().min(3),
  budget: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine((value) => Number(value) > 0),
  approver: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high']),
  justification: z.string().trim().min(20),
})
type Values = z.infer<typeof schema>
// Fields validated before leaving each step.
const steps = [
  { key: 'stepDetails', fields: ['name', 'budget'] },
  { key: 'stepApproval', fields: ['approver', 'priority', 'justification'] },
  { key: 'stepReview', fields: [] },
] as const
const approvers = [
  { value: 'sam', label: 'Sam Taylor', description: 'Finance' },
  { value: 'alex', label: 'Alex Morgan', description: 'Operations' },
  { value: 'priya', label: 'Priya Nair', description: 'Engineering' },
]

export default function Wizard() {
  const { t } = useTranslation(ns)
  const [step, setStep] = useState(0)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      budget: '',
      approver: '',
      priority: 'normal',
      justification: '',
    },
  })
  const errors = form.formState.errors
  async function next() {
    const valid = await form.trigger([...steps[step]!.fields], {
      shouldFocus: true,
    })
    if (valid) setStep((value) => value + 1)
  }
  const submit = form.handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    toast.success(t('submitted'))
    form.reset()
    setStep(0)
  })
  const values = form.watch()
  return (
    <Card className="max-w-2xl">
      <CardHeader className="gap-4">
        <ol
          className="flex items-center gap-2"
          aria-label={t('stepOf', { current: step + 1, total: steps.length })}
        >
          {steps.map((item, index) => (
            <li
              key={item.key}
              aria-current={index === step ? 'step' : undefined}
              className="flex flex-1 items-center gap-2 last:flex-none"
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors',
                  index < step &&
                    'border-primary bg-primary text-primary-foreground',
                  index === step &&
                    'border-primary text-primary ring-4 ring-primary/10',
                  index > step && 'text-muted-foreground',
                )}
              >
                {index < step ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm sm:inline',
                  index === step ? 'font-medium' : 'text-muted-foreground',
                )}
              >
                {t(item.key)}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mx-1 h-px flex-1',
                    index < step ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          {t('stepOf', { current: step + 1, total: steps.length })}
        </p>
      </CardHeader>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (step < steps.length - 1) void next()
          else void submit()
        }}
      >
        <CardContent key={step} className="animate-page-in">
          {step === 0 && (
            <FieldGroup>
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="wizard-name">
                  {t('projectName')}
                </FieldLabel>
                <Input
                  id="wizard-name"
                  dir="auto"
                  aria-invalid={Boolean(errors.name)}
                  {...form.register('name')}
                />
                {errors.name && (
                  <FieldError>{t('projectNameError')}</FieldError>
                )}
              </Field>
              <Field data-invalid={Boolean(errors.budget)}>
                <FieldLabel htmlFor="wizard-budget">{t('budget')}</FieldLabel>
                <InputGroup className="max-w-56">
                  <InputGroupAddon>
                    <InputGroupText>{getCurrency()}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="wizard-budget"
                    dir="ltr"
                    inputMode="decimal"
                    aria-invalid={Boolean(errors.budget)}
                    {...form.register('budget', {
                      setValueAs: normalizeNumber,
                    })}
                  />
                </InputGroup>
                {errors.budget && <FieldError>{t('budgetError')}</FieldError>}
              </Field>
            </FieldGroup>
          )}
          {step === 1 && (
            <FieldGroup>
              <Field data-invalid={Boolean(errors.approver)}>
                <FieldLabel htmlFor="wizard-approver">
                  {t('approver')}
                </FieldLabel>
                <Controller
                  control={form.control}
                  name="approver"
                  render={({ field }) => (
                    <Combobox
                      id="wizard-approver"
                      options={approvers}
                      value={field.value || null}
                      onChange={(value) => field.onChange(value ?? '')}
                      aria-invalid={Boolean(errors.approver)}
                    />
                  )}
                />
                {errors.approver && (
                  <FieldError>{t('approverError')}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel id="wizard-priority">{t('priority')}</FieldLabel>
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      aria-labelledby="wizard-priority"
                      value={field.value}
                      onValueChange={(value) => value && field.onChange(value)}
                      className="w-fit"
                    >
                      {(['low', 'normal', 'high'] as const).map((value) => (
                        <ToggleGroupItem
                          key={value}
                          value={value}
                          className="px-3"
                        >
                          {t(value)}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  )}
                />
              </Field>
              <Field data-invalid={Boolean(errors.justification)}>
                <FieldLabel htmlFor="wizard-justification">
                  {t('justification')}
                </FieldLabel>
                <Textarea
                  id="wizard-justification"
                  dir="auto"
                  rows={4}
                  aria-invalid={Boolean(errors.justification)}
                  {...form.register('justification')}
                />
                <FieldDescription>{t('justificationHint')}</FieldDescription>
                {errors.justification && (
                  <FieldError>{t('justificationError')}</FieldError>
                )}
              </Field>
            </FieldGroup>
          )}
          {step === 2 && (
            <dl className="divide-y rounded-lg border text-sm">
              {[
                [t('projectName'), values.name, 0],
                [
                  t('budget'),
                  values.budget
                    ? money(Math.round(Number(values.budget) * 100))
                    : '',
                  0,
                ],
                [
                  t('approver'),
                  approvers.find((item) => item.value === values.approver)
                    ?.label,
                  1,
                ],
                [t('priority'), t(values.priority), 1],
                [t('justification'), values.justification, 1],
              ].map(([label, value, target]) => (
                <div
                  key={String(label)}
                  className="grid grid-cols-[8rem_1fr_auto] items-start gap-3 px-4 py-3"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 wrap-anywhere" dir="auto">
                    {value}
                  </dd>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="-my-1.5 size-7"
                    aria-label={`${t('edit')} ${label}`}
                    onClick={() => setStep(Number(target))}
                  >
                    <Pencil />
                  </Button>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
        <CardFooter className="mt-6 justify-between border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((value) => value - 1)}
          >
            {t('previous')}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Spinner data-icon="inline-start" />
            )}
            {t(step === steps.length - 1 ? 'submit' : 'next')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
