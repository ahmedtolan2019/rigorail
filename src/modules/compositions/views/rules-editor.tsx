import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Minus,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { money, normalizeNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'

registerCopy({
  reIntro: [
    'Rules run top to bottom; the first rule whose conditions all match decides the route.',
    'تُطبق القواعد من الأعلى للأسفل؛ أول قاعدة تتحقق كل شروطها تحدد المسار.',
  ],
  reRule: ['Rule {{number}}', 'القاعدة {{number}}'],
  reName: ['Rule name', 'اسم القاعدة'],
  reWhen: ['When', 'عندما'],
  reAnd: ['and', 'و'],
  reRouteTo: ['Route to', 'يُوجّه إلى'],
  reAddCondition: ['Add condition', 'إضافة شرط'],
  reAddStep: ['Add approver step', 'إضافة خطوة اعتماد'],
  reAddRule: ['Add rule', 'إضافة قاعدة'],
  reFallback: ['Everything else', 'كل ما عدا ذلك'],
  reFallbackHint: [
    'Applies when no rule above matches.',
    'تُطبق عندما لا تتحقق أي قاعدة أعلاه.',
  ],
  reField: ['Field', 'الحقل'],
  reOperator: ['Operator', 'المعامل'],
  reValue: ['Value', 'القيمة'],
  reAmount: ['Amount', 'المبلغ'],
  reCategory: ['Category', 'الفئة'],
  reDepartment: ['Department', 'الإدارة'],
  reGt: ['is more than', 'أكبر من'],
  reGte: ['is at least', 'لا يقل عن'],
  reLt: ['is less than', 'أقل من'],
  reEq: ['is', 'يساوي'],
  reNeq: ['is not', 'لا يساوي'],
  reMoveUp: ['Move rule {{number}} up', 'نقل القاعدة {{number}} للأعلى'],
  reMoveDown: ['Move rule {{number}} down', 'نقل القاعدة {{number}} للأسفل'],
  reDeleteRule: ['Delete rule {{number}}', 'حذف القاعدة {{number}}'],
  reRemoveCondition: ['Remove condition', 'إزالة الشرط'],
  reStepEarlier: ['Move {{name}} earlier', 'تقديم {{name}}'],
  reStepLater: ['Move {{name}} later', 'تأخير {{name}}'],
  reRemoveStep: ['Remove {{name}}', 'إزالة {{name}}'],
  reErrName: ['Name the rule.', 'سمِّ القاعدة.'],
  reErrValue: ['Every condition needs a value.', 'كل شرط يحتاج قيمة.'],
  reErrAmount: ['Amounts must be numbers.', 'يجب أن تكون المبالغ أرقامًا.'],
  reErrSteps: [
    'Add at least one approver step.',
    'أضف خطوة اعتماد واحدة على الأقل.',
  ],
  reErrConditions: [
    'Add a condition, or this rule catches everything below it.',
    'أضف شرطًا، وإلا ستلتقط هذه القاعدة كل ما بعدها.',
  ],
  reErrShadowed: [
    'Never runs: rule {{number}} above already matches everything this rule matches.',
    'لن تُطبق أبدًا: القاعدة {{number}} أعلاه تطابق كل ما تطابقه هذه القاعدة.',
  ],
  reIssues_one: [
    '{{count}} issue to fix before saving',
    'مشكلة واحدة يجب حلها قبل الحفظ',
  ],
  reIssues: [
    '{{count}} issues to fix before saving',
    '{{count}} مشكلات يجب حلها قبل الحفظ',
  ],
  reSave: ['Publish rules', 'نشر القواعد'],
  reSaveTitle: ['Publish approval rules?', 'نشر قواعد الاعتماد؟'],
  reSaveHint: [
    'New requests use these rules immediately. Requests already in approval keep their current route.',
    'تستخدم الطلبات الجديدة هذه القواعد فورًا. تحتفظ الطلبات قيد الاعتماد بمسارها الحالي.',
  ],
  rePublished: ['Approval rules published.', 'تم نشر قواعد الاعتماد.'],
  reTest: ['Test a request', 'اختبار طلب'],
  reTestHint: [
    'Try a sample request to see which rule decides its route.',
    'جرّب طلبًا تجريبيًا لمعرفة القاعدة التي تحدد مساره.',
  ],
  reMatched: [
    'Matched rule {{number}}: {{name}}',
    'طابقت القاعدة {{number}}: {{name}}',
  ],
  reMatchedFallback: [
    'No rule matched; the fallback applies.',
    'لم تتطابق أي قاعدة؛ تُطبق القاعدة الافتراضية.',
  ],
  reResultRoute: ['Resulting route', 'المسار الناتج'],
  reRules: ['Rules', 'القواعد'],
  reStepManager: ['Line manager', 'المدير المباشر'],
  reStepBudget: ['Budget owner', 'مالك الميزانية'],
  reStepFinance: ['Finance', 'المالية'],
  reStepLegal: ['Legal', 'الشؤون القانونية'],
  reStepCfo: ['Chief financial officer', 'المدير المالي'],
  reStepIt: ['IT security', 'أمن المعلومات'],
  reSelected: ['Selected', 'مختار'],
  reValid: ['All rules are valid.', 'كل القواعد صالحة.'],
})

type Field = 'amount' | 'category' | 'department'
type Operator = 'gt' | 'gte' | 'lt' | 'eq' | 'neq'
interface Condition {
  field: Field
  op: Operator
  value: string
}
interface Rule {
  id: number
  name: string
  conditions: Condition[]
  steps: string[]
}
const steps = [
  'reStepManager',
  'reStepBudget',
  'reStepFinance',
  'reStepLegal',
  'reStepCfo',
  'reStepIt',
]
const options: Record<Exclude<Field, 'amount'>, string[]> = {
  category: ['Hardware', 'Software', 'Services', 'Travel'],
  department: ['Operations', 'Finance', 'Engineering', 'Sales'],
}
const operatorsFor = (field: Field): Operator[] =>
  field === 'amount' ? ['gt', 'gte', 'lt'] : ['eq', 'neq']
const opKey: Record<Operator, string> = {
  gt: 'reGt',
  gte: 'reGte',
  lt: 'reLt',
  eq: 'reEq',
  neq: 'reNeq',
}
const fieldKey: Record<Field, string> = {
  amount: 'reAmount',
  category: 'reCategory',
  department: 'reDepartment',
}
let nextId = 10
const seed: Rule[] = [
  {
    id: 1,
    name: 'Large software',
    conditions: [
      { field: 'category', op: 'eq', value: 'Software' },
      { field: 'amount', op: 'gt', value: '50000' },
    ],
    steps: ['reStepManager', 'reStepIt', 'reStepFinance', 'reStepCfo'],
  },
  {
    id: 2,
    name: 'Large spend',
    conditions: [{ field: 'amount', op: 'gt', value: '25000' }],
    steps: ['reStepManager', 'reStepFinance'],
  },
  {
    id: 3,
    name: 'Software',
    conditions: [{ field: 'category', op: 'eq', value: 'Software' }],
    steps: ['reStepManager', 'reStepIt'],
  },
]
const fallback = ['reStepManager']
const sameCondition = (a: Condition, b: Condition) =>
  a.field === b.field && a.op === b.op && a.value.trim() === b.value.trim()

function test(
  condition: Condition,
  sample: { amount: string; category: string; department: string },
) {
  if (condition.field === 'amount') {
    const amount = Number(normalizeNumber(sample.amount))
    const value = Number(normalizeNumber(condition.value))
    return condition.op === 'gt'
      ? amount > value
      : condition.op === 'gte'
        ? amount >= value
        : amount < value
  }
  const actual = sample[condition.field]
  return condition.op === 'eq'
    ? actual === condition.value
    : actual !== condition.value
}

export default function RulesEditor() {
  const { t } = useTranslation(ns)
  const [rules, setRules] = useState(seed)
  const [sample, setSample] = useState({
    amount: '30000',
    category: 'Software',
    department: 'Engineering',
  })
  const update = (id: number, change: (rule: Rule) => Rule) =>
    setRules((list) =>
      list.map((rule) => (rule.id === id ? change(rule) : rule)),
    )
  const moveRule = (index: number, delta: number) =>
    setRules((list) => {
      const next = [...list]
      const [rule] = next.splice(index, 1)
      next.splice(index + delta, 0, rule!)
      return next
    })

  // Validation is derived from the rules, so problems update as the person types.
  const problems = rules.map((rule, index) => {
    const list: string[] = []
    if (!rule.name.trim()) list.push(t('reErrName'))
    if (!rule.conditions.length) list.push(t('reErrConditions'))
    if (rule.conditions.some((condition) => !condition.value.trim()))
      list.push(t('reErrValue'))
    if (
      rule.conditions.some(
        (condition) =>
          condition.field === 'amount' &&
          condition.value.trim() &&
          !/^\d+(\.\d+)?$/.test(normalizeNumber(condition.value)),
      )
    )
      list.push(t('reErrAmount'))
    if (!rule.steps.length) list.push(t('reErrSteps'))
    // An earlier rule whose conditions are all present here matches first, every time.
    const shadow = rules
      .slice(0, index)
      .findIndex(
        (earlier) =>
          earlier.conditions.length > 0 &&
          earlier.conditions.every((condition) =>
            rule.conditions.some((own) => sameCondition(condition, own)),
          ),
      )
    if (shadow >= 0) list.push(t('reErrShadowed', { number: shadow + 1 }))
    return list
  })
  const issueCount = problems.reduce((sum, list) => sum + list.length, 0)
  const valid = (rule: Rule, index: number) =>
    problems[index]!.length === 0 && rule.conditions.length > 0
  const matchIndex = rules.findIndex(
    (rule, index) =>
      valid(rule, index) &&
      rule.conditions.every((condition) => test(condition, sample)),
  )
  const route = matchIndex >= 0 ? rules[matchIndex]!.steps : fallback

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4 2xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
        <p className="text-sm text-muted-foreground">{t('reIntro')}</p>
        <ol aria-label={t('reRules')} className="grid gap-3">
          {rules.map((rule, index) => {
            const number = index + 1
            const matched = index === matchIndex
            return (
              <li key={rule.id}>
                <Card
                  className={cn(
                    'min-w-0 gap-3 px-4 py-3 transition-shadow',
                    matched && 'ring-2 ring-primary',
                    problems[index]!.length > 0 && 'border-warning/60',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                      {number}
                    </span>
                    <Input
                      value={rule.name}
                      aria-label={`${t('reName')} ${number}`}
                      placeholder={t('reName')}
                      onChange={(event) =>
                        update(rule.id, (current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="h-8 min-w-0 flex-1 font-medium"
                    />
                    {matched && (
                      <Badge className="hidden rounded-full sm:inline-flex">
                        {t('reSelected')}
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      disabled={index === 0}
                      onClick={() => moveRule(index, -1)}
                      aria-label={t('reMoveUp', { number })}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      disabled={index === rules.length - 1}
                      onClick={() => moveRule(index, 1)}
                      aria-label={t('reMoveDown', { number })}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const before = rules
                        setRules((list) =>
                          list.filter((item) => item.id !== rule.id),
                        )
                        toast(t('reDeleteRule', { number }), {
                          action: {
                            label: t('undo'),
                            onClick: () => setRules(before),
                          },
                        })
                      }}
                      aria-label={t('reDeleteRule', { number })}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t('reWhen')}
                    </p>
                    {rule.conditions.map((condition, position) => {
                      const passes =
                        condition.value.trim() !== '' && test(condition, sample)
                      return (
                        <div
                          key={position}
                          className="flex flex-wrap items-center gap-2"
                        >
                          {position > 0 && (
                            <span className="w-8 text-xs text-muted-foreground">
                              {t('reAnd')}
                            </span>
                          )}
                          <Select
                            value={condition.field}
                            onValueChange={(field) =>
                              update(rule.id, (current) => ({
                                ...current,
                                conditions: current.conditions.map((item, i) =>
                                  i === position
                                    ? {
                                        field: field as Field,
                                        op: operatorsFor(field as Field)[0]!,
                                        value: '',
                                      }
                                    : item,
                                ),
                              }))
                            }
                          >
                            <SelectTrigger
                              size="sm"
                              className="w-32"
                              aria-label={t('reField')}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(fieldKey) as Field[]).map(
                                (field) => (
                                  <SelectItem key={field} value={field}>
                                    {t(fieldKey[field])}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <Select
                            value={condition.op}
                            onValueChange={(op) =>
                              update(rule.id, (current) => ({
                                ...current,
                                conditions: current.conditions.map((item, i) =>
                                  i === position
                                    ? { ...item, op: op as Operator }
                                    : item,
                                ),
                              }))
                            }
                          >
                            <SelectTrigger
                              size="sm"
                              className="w-36"
                              aria-label={t('reOperator')}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {operatorsFor(condition.field).map((op) => (
                                <SelectItem key={op} value={op}>
                                  {t(opKey[op])}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {condition.field === 'amount' ? (
                            <Input
                              inputMode="decimal"
                              dir="ltr"
                              value={condition.value}
                              aria-label={`${t('reValue')}: ${t('reAmount')}`}
                              aria-invalid={
                                !/^\d+(\.\d+)?$/.test(
                                  normalizeNumber(condition.value),
                                ) || undefined
                              }
                              onChange={(event) =>
                                update(rule.id, (current) => ({
                                  ...current,
                                  conditions: current.conditions.map(
                                    (item, i) =>
                                      i === position
                                        ? { ...item, value: event.target.value }
                                        : item,
                                  ),
                                }))
                              }
                              className="h-8 w-28 text-end tabular-nums"
                            />
                          ) : (
                            <Select
                              value={condition.value || undefined}
                              onValueChange={(value) =>
                                update(rule.id, (current) => ({
                                  ...current,
                                  conditions: current.conditions.map(
                                    (item, i) =>
                                      i === position
                                        ? { ...item, value }
                                        : item,
                                  ),
                                }))
                              }
                            >
                              <SelectTrigger
                                size="sm"
                                className={cn(
                                  'w-36',
                                  !condition.value && 'border-warning',
                                )}
                                aria-label={`${t('reValue')}: ${t(fieldKey[condition.field])}`}
                              >
                                <SelectValue placeholder={t('reValue')} />
                              </SelectTrigger>
                              <SelectContent>
                                {options[condition.field].map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {/* Live result of this condition against the test request. */}
                          <span
                            className={cn(
                              'grid size-5 place-items-center rounded-full',
                              passes
                                ? 'bg-success/15 text-success'
                                : 'bg-muted text-muted-foreground',
                            )}
                            aria-hidden="true"
                          >
                            {passes ? (
                              <Check className="size-3" />
                            ) : (
                              <Minus className="size-3" />
                            )}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground"
                            onClick={() =>
                              update(rule.id, (current) => ({
                                ...current,
                                conditions: current.conditions.filter(
                                  (_, i) => i !== position,
                                ),
                              }))
                            }
                            aria-label={t('reRemoveCondition')}
                          >
                            <X />
                          </Button>
                        </div>
                      )
                    })}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-fit"
                      onClick={() =>
                        update(rule.id, (current) => ({
                          ...current,
                          conditions: [
                            ...current.conditions,
                            { field: 'amount', op: 'gt', value: '' },
                          ],
                        }))
                      }
                    >
                      <Plus data-icon="inline-start" />
                      {t('reAddCondition')}
                    </Button>
                  </div>
                  <div className="grid gap-2 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t('reRouteTo')}
                    </p>
                    <ol className="flex flex-wrap items-center gap-1.5">
                      {rule.steps.map((step, position) => (
                        <li key={step} className="flex items-center gap-1.5">
                          <span className="flex items-center rounded-full border bg-card text-xs font-medium">
                            <span className="py-1 ps-2.5 pe-1">
                              {position + 1}. {t(step)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-6 rounded-full"
                              disabled={position === 0}
                              onClick={() =>
                                update(rule.id, (current) => {
                                  const next = [...current.steps]
                                  ;[next[position - 1], next[position]] = [
                                    next[position]!,
                                    next[position - 1]!,
                                  ]
                                  return { ...current, steps: next }
                                })
                              }
                              aria-label={t('reStepEarlier', { name: t(step) })}
                            >
                              <ArrowLeft className="size-3 rtl:-scale-x-100" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-6 rounded-full"
                              disabled={position === rule.steps.length - 1}
                              onClick={() =>
                                update(rule.id, (current) => {
                                  const next = [...current.steps]
                                  ;[next[position + 1], next[position]] = [
                                    next[position]!,
                                    next[position + 1]!,
                                  ]
                                  return { ...current, steps: next }
                                })
                              }
                              aria-label={t('reStepLater', { name: t(step) })}
                            >
                              <ArrowRight className="size-3 rtl:-scale-x-100" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="me-0.5 size-6 rounded-full text-muted-foreground"
                              onClick={() =>
                                update(rule.id, (current) => ({
                                  ...current,
                                  steps: current.steps.filter(
                                    (item) => item !== step,
                                  ),
                                }))
                              }
                              aria-label={t('reRemoveStep', { name: t(step) })}
                            >
                              <X className="size-3" />
                            </Button>
                          </span>
                          {position < rule.steps.length - 1 && (
                            <ChevronRight
                              aria-hidden="true"
                              className="size-3.5 text-muted-foreground rtl:-scale-x-100"
                            />
                          )}
                        </li>
                      ))}
                      {steps.some((step) => !rule.steps.includes(step)) && (
                        <li>
                          <Select
                            value=""
                            onValueChange={(step) =>
                              update(rule.id, (current) => ({
                                ...current,
                                steps: [...current.steps, step],
                              }))
                            }
                          >
                            <SelectTrigger
                              size="sm"
                              className="h-7 w-auto rounded-full border-dashed text-xs"
                              aria-label={`${t('reAddStep')}: ${t('reRule', { number })}`}
                            >
                              <Plus className="size-3" />
                              <SelectValue placeholder={t('reAddStep')} />
                            </SelectTrigger>
                            <SelectContent>
                              {steps
                                .filter((step) => !rule.steps.includes(step))
                                .map((step) => (
                                  <SelectItem key={step} value={step}>
                                    {t(step)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </li>
                      )}
                    </ol>
                  </div>
                  {problems[index]!.length > 0 && (
                    <ul className="grid gap-1 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                      {problems[index]!.map((problem) => (
                        <li key={problem} className="flex items-start gap-1.5">
                          <CircleAlert
                            aria-hidden="true"
                            className="mt-px size-3.5 shrink-0"
                          />
                          {problem}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </li>
            )
          })}
          <li>
            <Card
              className={cn(
                'gap-1 border-dashed bg-muted/30 px-4 py-3',
                matchIndex < 0 && 'ring-2 ring-primary',
              )}
            >
              <p className="text-sm font-medium">{t('reFallback')}</p>
              <p className="text-xs text-muted-foreground">
                {t('reFallbackHint')} {t('reRouteTo')}:{' '}
                {fallback.map((step) => t(step)).join(', ')}
              </p>
            </Card>
          </li>
        </ol>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() =>
            setRules((list) => [
              ...list,
              {
                id: nextId++,
                name: '',
                conditions: [{ field: 'amount', op: 'gt', value: '' }],
                steps: ['reStepManager'],
              },
            ])
          }
        >
          <Plus data-icon="inline-start" />
          {t('reAddRule')}
        </Button>
      </div>

      <div className="grid content-start items-start gap-3 lg:grid-cols-2 2xl:sticky 2xl:top-20 2xl:grid-cols-1 2xl:self-start">
        <Card className="gap-4 px-5 py-4">
          <div className="flex items-start gap-2">
            <FlaskConical
              aria-hidden="true"
              className="mt-0.5 size-4 text-muted-foreground"
            />
            <div>
              <h3 className="text-sm font-semibold">{t('reTest')}</h3>
              <p className="text-xs text-muted-foreground">{t('reTestHint')}</p>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="re-amount">{t('reAmount')}</Label>
              <Input
                id="re-amount"
                dir="ltr"
                inputMode="decimal"
                value={sample.amount}
                onChange={(event) =>
                  setSample((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className="text-end tabular-nums"
              />
            </div>
            {(['category', 'department'] as const).map((field) => (
              <div key={field} className="grid gap-1.5">
                <Label id={`re-sample-${field}`}>{t(fieldKey[field])}</Label>
                <Select
                  value={sample[field]}
                  onValueChange={(value) =>
                    setSample((current) => ({ ...current, [field]: value }))
                  }
                >
                  <SelectTrigger
                    aria-labelledby={`re-sample-${field}`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options[field].map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="grid gap-2 border-t pt-4" aria-live="polite">
            <p className="text-sm font-medium">
              {matchIndex >= 0
                ? t('reMatched', {
                    number: matchIndex + 1,
                    name: rules[matchIndex]!.name,
                  })
                : t('reMatchedFallback')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('reResultRoute')} ·{' '}
              <bdi>
                {money(
                  Math.round(Number(normalizeNumber(sample.amount)) * 100) || 0,
                )}
              </bdi>
            </p>
            <ol className="grid gap-1.5">
              {route.map((step, position) => (
                <li key={step} className="flex items-center gap-2 text-sm">
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-[0.625rem] font-semibold text-primary-foreground">
                    {position + 1}
                  </span>
                  {t(step)}
                </li>
              ))}
            </ol>
          </div>
        </Card>
        <Card className="gap-2 px-5 py-4">
          <p
            className={cn(
              'text-sm',
              issueCount ? 'font-medium text-warning' : 'text-muted-foreground',
            )}
          >
            {issueCount ? t('reIssues', { count: issueCount }) : t('reValid')}
          </p>
          <ConfirmAction
            tone="warning"
            title={t('reSaveTitle')}
            description={t('reSaveHint')}
            chips={rules.map((rule, index) => `${index + 1}. ${rule.name}`)}
            confirmLabel={t('reSave')}
            onConfirm={() => toast.success(t('rePublished'))}
          >
            <Button disabled={issueCount > 0}>{t('reSave')}</Button>
          </ConfirmAction>
        </Card>
      </div>
    </div>
  )
}
