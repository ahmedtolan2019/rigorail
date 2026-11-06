import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Bookmark, Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useServices } from '@/shared/api/services'
import {
  canonical,
  savedViewSchema,
  savedViewsSchema,
  type SavedView,
  type SavedViewState,
} from './saved-views-model'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Spinner } from '@/shared/ui/spinner'

/**
 * Per-user named views for a list (`GET/POST /views?scope=`, `DELETE /views/:id`).
 * The trigger names the active view, or "Custom view" once the state diverges.
 */
export function SavedViews({
  scope,
  current,
  defaultLabel,
  onApply,
}: {
  /** Stable list identifier, for example `requests`. */
  scope: string
  /** The present state with only non-default values; empty means the default view. */
  current: SavedViewState
  /** Name of the list's default state, for example "All requests". */
  defaultLabel: string
  /** Applies a saved state; `null` restores the defaults. */
  onApply: (state: SavedViewState | null) => void
}) {
  const { t } = useTranslation()
  const { api, session } = useServices()
  const client = useQueryClient()
  const key = ['views', session.user.id, session.workspace.id, scope]
  const views = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      api.request(
        `/views?${new URLSearchParams({ scope })}`,
        savedViewsSchema,
        {
          signal,
        },
      ),
  })
  const [naming, setNaming] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const refresh = () => client.invalidateQueries({ queryKey: key })
  const remove = useMutation({
    mutationFn: (view: SavedView) =>
      api.request(`/views/${encodeURIComponent(view.id)}`, z.undefined(), {
        method: 'DELETE',
      }),
    onSuccess: (_, view) =>
      toast(t('viewDeleted', { name: view.name }), {
        action: {
          label: t('undo'),
          onClick: () =>
            void api
              .request('/views', savedViewSchema, {
                method: 'POST',
                body: JSON.stringify({
                  scope,
                  name: view.name,
                  state: view.state,
                }),
              })
              .then(refresh),
        },
      }),
    onError: () => toast.error(t('unavailable')),
    onSettled: refresh,
  })
  const state = canonical(current)
  const active = views.data?.items.find(
    (view) => canonical(view.state) === state,
  )
  const isDefault = Object.keys(current.search).length === 0 && !current.columns
  const label = active?.name ?? (isDefault ? defaultLabel : t('customView'))
  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 sm:max-w-56"
            aria-label={`${t('savedViews')}: ${label}`}
          >
            <Bookmark aria-hidden="true" />
            <span className="hidden truncate sm:inline">{label}</span>
            <ChevronDown
              aria-hidden="true"
              className="hidden opacity-60 sm:block"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>{t('savedViews')}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => onApply(null)}>
            <Check className={isDefault && !active ? '' : 'invisible'} />
            {defaultLabel}
          </DropdownMenuItem>
          {views.isPending && (
            <div className="flex justify-center py-2">
              <Spinner className="size-4 text-muted-foreground" />
            </div>
          )}
          {views.data?.items.map((view) => (
            <DropdownMenuItem
              key={view.id}
              onSelect={() => onApply(view.state)}
              className="group/view pe-1"
            >
              <Check className={active?.id === view.id ? '' : 'invisible'} />
              <span className="min-w-0 flex-1 truncate" dir="auto">
                {view.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground opacity-0 group-hover/view:opacity-100 group-focus/view:opacity-100 hover:text-destructive"
                aria-label={t('deleteView', { name: view.name })}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  // Close first: the open menu would block the toast's Undo.
                  setMenuOpen(false)
                  remove.mutate(view)
                }}
              >
                <Trash2 />
              </Button>
            </DropdownMenuItem>
          ))}
          {views.data?.items.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              {t('noSavedViews')}
            </p>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setNaming(true)}>
            <Plus />
            {t('saveView')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SaveViewDialog
        open={naming}
        onOpenChange={setNaming}
        scope={scope}
        state={current}
        onSaved={refresh}
      />
    </>
  )
}

function SaveViewDialog({
  open,
  onOpenChange,
  scope,
  state,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  scope: string
  state: SavedViewState
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const { api } = useServices()
  const [name, setName] = useState('')
  const [invalid, setInvalid] = useState(false)
  const save = useMutation({
    mutationFn: () =>
      api.request('/views', savedViewSchema, {
        method: 'POST',
        body: JSON.stringify({ scope, name: name.trim(), state }),
      }),
    onSuccess: (view) => {
      toast.success(t('viewSaved', { name: view.name }))
      onSaved()
      onOpenChange(false)
      setName('')
    },
  })
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setInvalid(false)
          save.reset()
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('saveViewTitle')}</DialogTitle>
          <DialogDescription>{t('saveViewHint')}</DialogDescription>
        </DialogHeader>
        <form
          id="save-view"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const valid = name.trim().length >= 2 && name.trim().length <= 60
            setInvalid(!valid)
            if (valid) save.mutate()
          }}
        >
          <Field data-invalid={invalid}>
            <FieldLabel htmlFor="save-view-name">{t('viewName')}</FieldLabel>
            <Input
              id="save-view-name"
              dir="auto"
              autoFocus
              value={name}
              aria-invalid={invalid}
              onChange={(event) => setName(event.target.value)}
            />
            {invalid && <FieldError>{t('viewNameError')}</FieldError>}
            {save.isError && <FieldError>{t('unavailable')}</FieldError>}
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="save-view" disabled={save.isPending}>
            {save.isPending && <Spinner data-icon="inline-start" />}
            {t('saveViewConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
