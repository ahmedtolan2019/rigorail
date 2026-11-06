import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Building2, Plus, Trash2, UserRound } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Spinner } from '@/shared/ui/spinner'
import { Switch } from '@/shared/ui/switch'
import { ns } from '../messages'

const contact = z.object({
  name: z.string().trim().min(2, 'requiredError'),
  email: z.email('emailError'),
  role: z.string().trim().min(2, 'requiredError'),
})
// Rules that depend on other answers live in one place; hidden fields are not validated.
const schema = z
  .object({
    type: z.enum(['company', 'individual']),
    name: z.string().trim().min(2, 'requiredError'),
    registration: z.string().trim(),
    vatRegistered: z.boolean(),
    vatNumber: z.string().trim(),
    payment: z.enum(['bank', 'check']),
    iban: z.string().trim(),
    bankName: z.string().trim(),
    contacts: z.array(contact).min(1),
  })
  .superRefine((value, context) => {
    const check = (ok: boolean, path: string, message = 'requiredError') =>
      ok || context.addIssue({ code: 'custom', path: [path], message })
    if (value.type === 'company')
      check(value.registration.length >= 4, 'registration')
    if (value.vatRegistered)
      check(/^\d{15}$/.test(value.vatNumber), 'vatNumber', 'vatError')
    if (value.payment === 'bank') {
      check(
        /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(
          value.iban.replace(/\s/g, '').toUpperCase(),
        ),
        'iban',
        'ibanError',
      )
      check(value.bankName.length >= 2, 'bankName')
    }
  })
type Values = z.infer<typeof schema>
const emptyContact = { name: '', email: '', role: '' }

export default function ConditionalForm() {
  const { t } = useTranslation(ns)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      type: 'company',
      name: '',
      registration: '',
      vatRegistered: false,
      vatNumber: '',
      payment: 'bank',
      iban: '',
      bankName: '',
      contacts: [emptyContact],
    },
  })
  const contacts = useFieldArray({ control: form.control, name: 'contacts' })
  const [type, vatRegistered, payment] = useWatch({
    control: form.control,
    name: ['type', 'vatRegistered', 'payment'],
  })
  const errors = form.formState.errors
  const message = (key?: string) => (key ? [{ message: t(key) }] : undefined)
  const submit = form.handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    toast.success(t('vendorSubmitted'))
    form.reset()
  })
  const text = (
    name: 'name' | 'registration' | 'vatNumber' | 'iban' | 'bankName',
    label: string,
    hint?: string,
    ltr = false,
  ) => (
    <Field
      data-invalid={!!errors[name]}
      className="animate-in duration-200 fade-in-0"
    >
      <FieldLabel htmlFor={`vendor-${name}`}>{label}</FieldLabel>
      <Input
        id={`vendor-${name}`}
        dir={ltr ? 'ltr' : undefined}
        aria-invalid={!!errors[name]}
        {...form.register(name)}
      />
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={message(errors[name]?.message)} />
    </Field>
  )

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      className="max-w-2xl"
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('vendorTitle')}</CardTitle>
          <CardDescription>{t('vendorHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldSet>
              <FieldLegend variant="label">{t('vendorType')}</FieldLegend>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-2 gap-2"
                  >
                    {(
                      [
                        ['company', Building2],
                        ['individual', UserRound],
                      ] as const
                    ).map(([value, Icon]) => (
                      <FieldLabel
                        key={value}
                        htmlFor={`vendor-type-${value}`}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
                          field.value === value &&
                            'border-primary bg-primary/5 hover:bg-primary/5',
                        )}
                      >
                        <RadioGroupItem
                          id={`vendor-type-${value}`}
                          value={value}
                        />
                        <Icon
                          aria-hidden="true"
                          className="size-4 text-muted-foreground"
                        />
                        {t(value)}
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                )}
              />
            </FieldSet>
            {text(
              'name',
              type === 'company' ? t('companyName') : t('fullName'),
            )}
            {type === 'company' &&
              text(
                'registration',
                t('registration'),
                t('registrationHint'),
                true,
              )}
            <Controller
              control={form.control}
              name="vatRegistered"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="vendor-vat">
                      {t('vatRegistered')}
                    </FieldLabel>
                    <FieldDescription>
                      {t('vatRegisteredHint')}
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="vendor-vat"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
            {vatRegistered &&
              text('vatNumber', t('vatNumber'), t('vatNumberHint'), true)}
            <Controller
              control={form.control}
              name="payment"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="vendor-payment">
                    {t('paymentMethod')}
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="vendor-payment"
                      className="w-full sm:w-64"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">{t('bankTransfer')}</SelectItem>
                      <SelectItem value="check">{t('cheque')}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            {payment === 'bank' && (
              <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                {text('iban', t('iban'), undefined, true)}
                {text('bankName', t('bankName'))}
              </div>
            )}
            <FieldSet>
              <FieldLegend variant="label">{t('contacts')}</FieldLegend>
              <FieldDescription>{t('contactsHint')}</FieldDescription>
              <ul className="grid gap-3">
                {contacts.fields.map((item, index) => {
                  const error = errors.contacts?.[index]
                  return (
                    <li
                      key={item.id}
                      className="relative grid animate-in gap-3 rounded-lg border p-3 duration-200 fade-in-0 sm:grid-cols-3"
                    >
                      <span className="text-xs font-medium text-muted-foreground sm:col-span-3">
                        {index === 0
                          ? t('primaryContact')
                          : t('contactNumber', { number: index + 1 })}
                      </span>
                      {(['name', 'email', 'role'] as const).map((key) => (
                        <Field key={key} data-invalid={!!error?.[key]}>
                          <FieldLabel htmlFor={`contact-${item.id}-${key}`}>
                            {t(key === 'name' ? 'contactName' : key)}
                          </FieldLabel>
                          <Input
                            id={`contact-${item.id}-${key}`}
                            type={key === 'email' ? 'email' : 'text'}
                            dir={key === 'email' ? 'ltr' : undefined}
                            aria-invalid={!!error?.[key]}
                            {...form.register(`contacts.${index}.${key}`)}
                          />
                          <FieldError errors={message(error?.[key]?.message)} />
                        </Field>
                      ))}
                      {contacts.fields.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute end-1.5 top-1.5 size-7 text-muted-foreground"
                          onClick={() => contacts.remove(index)}
                          aria-label={t('removeContact', { number: index + 1 })}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={contacts.fields.length >= 4}
                onClick={() =>
                  contacts.append(emptyContact, { shouldFocus: true })
                }
              >
                <Plus data-icon="inline-start" />
                {t('addContact')}
              </Button>
            </FieldSet>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t">
          <Button type="button" variant="ghost" onClick={() => form.reset()}>
            {t('reset')}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Spinner data-icon="inline-start" />
            )}
            {t('submitVendor')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
