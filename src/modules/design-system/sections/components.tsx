import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Archive,
  CircleAlert,
  Copy,
  Info,
  MoreHorizontal,
  Plus,
  Share2,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Combobox } from '@/shared/ui/combobox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Kbd } from '@/shared/ui/kbd'
import { Label } from '@/shared/ui/label'
import { Progress } from '@/shared/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'
import { Spinner } from '@/shared/ui/spinner'
import { Switch } from '@/shared/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { ns } from '../messages'
import { Showcase } from './section'

const people = [
  { value: 'sam', label: 'Sam Taylor', description: 'Finance' },
  { value: 'alex', label: 'Alex Morgan', description: 'Operations' },
  { value: 'priya', label: 'Priya Nair', description: 'Engineering' },
  { value: 'omar', label: 'Omar Haddad', description: 'Legal' },
  { value: 'lina', label: 'Lina Farouk', description: 'People' },
]
const departments = ['Finance', 'Operations', 'Engineering', 'Legal', 'People']

export default function Components() {
  const { t } = useTranslation(ns)
  const [approver, setApprover] = useState<string | null>('alex')
  const [teams, setTeams] = useState<string[]>(['Finance', 'Legal'])
  return (
    <div className="grid gap-6">
      <Showcase
        title={t('buttons')}
        hint={t('buttonsHint')}
        className="grid gap-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button>{t('primary')}</Button>
          <Button variant="secondary">{t('secondary')}</Button>
          <Button variant="outline">{t('outline')}</Button>
          <Button variant="ghost">{t('ghost')}</Button>
          <Button variant="destructive">{t('destructive')}</Button>
          <Button variant="link">{t('link')}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">
            <Plus />
            {t('withIcon')}
          </Button>
          <Button disabled>
            <Spinner />
            {t('loading')}
          </Button>
          <Button variant="outline" disabled>
            {t('disabled')}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t('share')}>
                <Share2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('share')} <Kbd>S</Kbd>
            </TooltipContent>
          </Tooltip>
          <Button size="lg">{t('primary')}</Button>
        </div>
      </Showcase>

      <Showcase
        title={t('inputs')}
        hint={t('inputsHint')}
        className="grid gap-6 md:grid-cols-2"
      >
        <Field>
          <FieldLabel htmlFor="ds-email">{t('email')}</FieldLabel>
          <Input
            id="ds-email"
            type="email"
            placeholder={t('emailPlaceholder')}
          />
          <FieldDescription>{t('emailPlaceholder')}</FieldDescription>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor="ds-email-invalid">{t('email')}</FieldLabel>
          <Input id="ds-email-invalid" aria-invalid defaultValue="sam@" />
          <FieldError>{t('invalid')}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="ds-department">{t('department')}</FieldLabel>
          <Select defaultValue="Finance">
            <SelectTrigger id="ds-department" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="ds-approver">{t('approver')}</FieldLabel>
          <Combobox
            id="ds-approver"
            options={people}
            value={approver}
            onChange={setApprover}
            placeholder={t('chooseApprover')}
          />
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor="ds-teams">{t('departments')}</FieldLabel>
          <Combobox
            id="ds-teams"
            multiple
            options={departments.map((item) => ({ value: item, label: item }))}
            value={teams}
            onChange={setTeams}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-6">
          <Label className="gap-2">
            <Checkbox defaultChecked />
            {t('notifications')}
          </Label>
          <Label className="gap-2">
            <Switch defaultChecked />
            {t('notifications')}
          </Label>
        </div>
      </Showcase>

      <div className="grid gap-6 lg:grid-cols-2">
        <Showcase
          title={t('feedback')}
          hint={t('feedbackHint')}
          className="grid gap-4"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => toast.success(t('toastSaved'))}
            >
              {t('toastSuccess')}
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error(t('toastFailed'))}
            >
              {t('toastError')}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.promise(
                  new Promise((resolve) => setTimeout(resolve, 1400)),
                  {
                    loading: t('toastWorking'),
                    success: t('toastDone'),
                  },
                )
              }
            >
              {t('toastPromise')}
            </Button>
          </div>
          <Alert>
            <Info />
            <AlertTitle>{t('alertInfo')}</AlertTitle>
          </Alert>
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>{t('toastFailed')}</AlertTitle>
            <AlertDescription>{t('alertError')}</AlertDescription>
          </Alert>
        </Showcase>
        <Showcase
          title={t('overlays')}
          hint={t('overlaysHint')}
          className="flex flex-wrap gap-2"
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">{t('openDialog')}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('dialogTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('dialogBody')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                <AlertDialogAction variant="destructive">
                  <Archive />
                  {t('archive')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal />
                {t('openSheet')}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t('sheetTitle')}</SheetTitle>
                <SheetDescription>{t('overlaysHint')}</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={t('actionsMenu')}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>
                <Copy />
                {t('duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 />
                {t('share')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Showcase>
      </div>

      <Showcase
        title={t('dataDisplay')}
        hint={t('dataDisplayHint')}
        className="grid gap-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{t('primary')}</Badge>
          <Badge variant="secondary">{t('secondary')}</Badge>
          <Badge variant="outline">{t('outline')}</Badge>
          <Badge variant="destructive">{t('destructive')}</Badge>
          <Badge
            variant="secondary"
            className="gap-1.5 rounded-full border-0 bg-success/12 text-success"
          >
            <i
              aria-hidden="true"
              className="size-1.5 rounded-full bg-success"
            />
            {t('requests:approved')}
          </Badge>
          <Badge
            variant="secondary"
            className="gap-1.5 rounded-full border-0 bg-warning/12 text-warning"
          >
            <i
              aria-hidden="true"
              className="size-1.5 rounded-full bg-warning"
            />
            {t('requests:pending')}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-1.5">
            {people.slice(0, 4).map((person) => (
              <Avatar key={person.value} className="size-8 ring-2 ring-card">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {person.label
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Progress value={64} className="max-w-xs" aria-label="64%" />
          <span className="text-sm text-muted-foreground tabular-nums">
            64%
          </span>
        </div>
      </Showcase>
    </div>
  )
}
