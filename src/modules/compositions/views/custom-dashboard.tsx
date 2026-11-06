import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GripVertical,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'
import { usePersistentState } from '@/shared/hooks/use-persistent-state'
import { compactMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'
import { BudgetBar, Metric, Sparkline } from '../sections/record'

registerCopy({
  cdCustomise: ['Customise', 'تخصيص'],
  cdDone: ['Done', 'تم'],
  cdAdd: ['Add widget', 'إضافة عنصر'],
  cdAllAdded: [
    'Every widget is on the dashboard.',
    'كل العناصر موجودة في اللوحة.',
  ],
  cdReset: ['Reset layout', 'إعادة ضبط التخطيط'],
  cdResetDone: ['Layout reset.', 'تمت إعادة ضبط التخطيط.'],
  cdEditing: [
    'Drag widgets, or use the buttons on each one. Changes are saved on this device.',
    'اسحب العناصر أو استخدم أزرار كل عنصر. تُحفظ التغييرات على هذا الجهاز.',
  ],
  cdMoveEarlier: ['Move {{name}} earlier', 'نقل {{name}} للأمام'],
  cdMoveLater: ['Move {{name}} later', 'نقل {{name}} للخلف'],
  cdWider: ['Make {{name}} wider', 'توسيع {{name}}'],
  cdNarrower: ['Make {{name}} narrower', 'تضييق {{name}}'],
  cdRemove: ['Remove {{name}}', 'إزالة {{name}}'],
  cdRemoved: ['{{name}} removed.', 'تمت إزالة {{name}}.'],
  cdMoved: [
    '{{name}} moved to position {{position}} of {{total}}.',
    'نُقل {{name}} إلى الموضع {{position}} من {{total}}.',
  ],
  cdEmpty: ['The dashboard is empty', 'اللوحة فارغة'],
  cdEmptyHint: [
    'Add the widgets you check every day.',
    'أضف العناصر التي تتابعها يوميًا.',
  ],
  cdSpend: ['Spend this month', 'إنفاق هذا الشهر'],
  cdSpendHint: ['8% under plan', 'أقل من الخطة بـ 8%'],
  cdApprovals: ['Waiting for me', 'بانتظاري'],
  cdApprovalsHint: ['2 due today', '2 مستحقة اليوم'],
  cdCycle: ['Average approval time', 'متوسط وقت الاعتماد'],
  cdTrend: ['Requests per week', 'الطلبات أسبوعيًا'],
  cdBudget: ['Operations budget', 'ميزانية العمليات'],
  cdSpent: ['Spent', 'المصروف'],
  cdCommitted: ['Committed', 'الملتزم به'],
  cdSuppliers: ['Top suppliers', 'أبرز الموردين'],
  cdDays: ['{{value}} days', '{{value}} أيام'],
})

type WidgetId =
  'spend' | 'approvals' | 'cycle' | 'trend' | 'budget' | 'suppliers'
interface Slot {
  id: WidgetId
  wide: boolean
}
const defaults: Slot[] = [
  { id: 'spend', wide: false },
  { id: 'approvals', wide: false },
  { id: 'cycle', wide: true },
  { id: 'trend', wide: true },
  { id: 'budget', wide: true },
]
const titles: Record<WidgetId, string> = {
  spend: 'cdSpend',
  approvals: 'cdApprovals',
  cycle: 'cdCycle',
  trend: 'cdTrend',
  budget: 'cdBudget',
  suppliers: 'cdSuppliers',
}
const all = Object.keys(titles) as WidgetId[]

export default function CustomDashboard() {
  const { t } = useTranslation(ns)
  const [layout, setLayout] = usePersistentState<Slot[]>(
    'compositions:dashboard-layout',
    defaults,
  )
  const [editing, setEditing] = useState(false)
  const [dragging, setDragging] = useState<WidgetId | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const name = (id: WidgetId) => t(titles[id])
  const move = (from: number, to: number) => {
    if (to < 0 || to >= layout.length || from === to) return
    const next = [...layout]
    const [slot] = next.splice(from, 1)
    next.splice(to, 0, slot!)
    setLayout(next)
    // Screen readers hear where the widget went; sighted users see it move.
    setAnnouncement(
      t('cdMoved', {
        name: name(slot!.id),
        position: to + 1,
        total: next.length,
      }),
    )
  }
  const missing = all.filter((id) => !layout.some((slot) => slot.id === id))

  const content: Record<WidgetId, ReactNode> = {
    spend: (
      <Metric
        label={name('spend')}
        value={<bdi>{compactMoney(4_821_000)}</bdi>}
        hint={t('cdSpendHint')}
        hintTone="success"
      />
    ),
    approvals: (
      <Metric
        label={name('approvals')}
        value="12"
        hint={t('cdApprovalsHint')}
        hintTone="warning"
      />
    ),
    cycle: (
      <Metric label={name('cycle')} value={t('cdDays', { value: 4.2 })}>
        <Sparkline
          values={[6.1, 5.8, 5.2, 5.4, 4.9, 4.6, 4.2]}
          tone="success"
          label={name('cycle')}
          className="h-6"
        />
      </Metric>
    ),
    trend: (
      <Metric label={name('trend')} value="58">
        <Sparkline
          values={[32, 41, 38, 52, 47, 61, 55, 66, 58]}
          label={name('trend')}
          className="h-14"
        />
      </Metric>
    ),
    budget: (
      <Metric
        label={name('budget')}
        value={<bdi>{compactMoney(1_210_000)}</bdi>}
      >
        <BudgetBar
          label={name('budget')}
          limit={4_000_000}
          format={compactMoney}
          segments={[
            { label: t('cdSpent'), value: 2_150_000, tone: 'primary' },
            { label: t('cdCommitted'), value: 640_000, tone: 'info' },
          ]}
        />
      </Metric>
    ),
    suppliers: (
      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">{name('suppliers')}</p>
        {[
          ['Northwind Traders', 18_420_000],
          ['Contoso Office', 9_310_000],
          ['Fabrikam Industrial', 6_050_000],
        ].map(([supplier, value]) => (
          <div key={supplier} className="grid gap-1">
            <div className="flex justify-between gap-2 text-sm">
              <span className="truncate">{supplier}</span>
              <bdi className="shrink-0 font-medium tabular-nums">
                {compactMoney(Number(value))}
              </bdi>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${(Number(value) / 18_420_000) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    ),
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {editing && (
          <p className="text-sm text-muted-foreground">{t('cdEditing')}</p>
        )}
        <div className="ms-auto flex flex-wrap gap-2">
          {editing && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus data-icon="inline-start" />
                    {t('cdAdd')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('cdAdd')}</DropdownMenuLabel>
                  {missing.length === 0 ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      {t('cdAllAdded')}
                    </p>
                  ) : (
                    missing.map((id) => (
                      <DropdownMenuItem
                        key={id}
                        onClick={() =>
                          setLayout([
                            ...layout,
                            { id, wide: id === 'trend' || id === 'budget' },
                          ])
                        }
                      >
                        {name(id)}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const before = layout
                  setLayout(defaults)
                  toast(t('cdResetDone'), {
                    action: {
                      label: t('undo'),
                      onClick: () => setLayout(before),
                    },
                  })
                }}
              >
                <RotateCcw data-icon="inline-start" />
                {t('cdReset')}
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant={editing ? 'default' : 'outline'}
            onClick={() => setEditing((value) => !value)}
            aria-pressed={editing}
          >
            {editing ? (
              <Check data-icon="inline-start" />
            ) : (
              <Pencil data-icon="inline-start" />
            )}
            {editing ? t('cdDone') : t('cdCustomise')}
          </Button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {layout.length === 0 ? (
        <Card className="grid place-items-center gap-2 px-6 py-12 text-center">
          <LayoutDashboard
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          />
          <p className="font-medium">{t('cdEmpty')}</p>
          <p className="text-sm text-muted-foreground">{t('cdEmptyHint')}</p>
          {!editing && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setEditing(true)}
            >
              {t('cdCustomise')}
            </Button>
          )}
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {layout.map((slot, index) => (
            <li
              key={slot.id}
              draggable={editing}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', slot.id)
                setDragging(slot.id)
              }}
              onDragEnd={() => setDragging(null)}
              onDragOver={(event) => editing && event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const id = event.dataTransfer.getData('text/plain')
                move(
                  layout.findIndex((item) => item.id === id),
                  index,
                )
              }}
              className={cn(
                slot.wide && 'sm:col-span-2',
                dragging === slot.id && 'opacity-40',
              )}
            >
              <Card
                className={cn(
                  'h-full min-w-0 gap-0 px-4 py-3.5 transition-shadow',
                  editing &&
                    'cursor-grab border-dashed ring-primary/20 hover:ring-4 active:cursor-grabbing',
                )}
              >
                {editing && (
                  <div className="-mx-1.5 -mt-1.5 mb-2 flex items-center gap-0.5 border-b pb-1.5">
                    <GripVertical
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                    <span className="min-w-0 flex-1 truncate ps-1 text-xs font-medium">
                      {name(slot.id)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      aria-label={t('cdMoveEarlier', { name: name(slot.id) })}
                    >
                      <ArrowLeft className="rtl:-scale-x-100" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={index === layout.length - 1}
                      onClick={() => move(index, index + 1)}
                      aria-label={t('cdMoveLater', { name: name(slot.id) })}
                    >
                      <ArrowRight className="rtl:-scale-x-100" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hidden size-7 sm:inline-flex"
                      onClick={() =>
                        setLayout(
                          layout.map((item) =>
                            item.id === slot.id
                              ? { ...item, wide: !item.wide }
                              : item,
                          ),
                        )
                      }
                      aria-label={t(slot.wide ? 'cdNarrower' : 'cdWider', {
                        name: name(slot.id),
                      })}
                    >
                      {slot.wide ? <Minimize2 /> : <Maximize2 />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const before = layout
                        setLayout(layout.filter((item) => item.id !== slot.id))
                        toast(t('cdRemoved', { name: name(slot.id) }), {
                          action: {
                            label: t('undo'),
                            onClick: () => setLayout(before),
                          },
                        })
                      }}
                      aria-label={t('cdRemove', { name: name(slot.id) })}
                    >
                      <X />
                    </Button>
                  </div>
                )}
                {content[slot.id]}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
