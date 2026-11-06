import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import { isApple, useShortcutRegistry } from './registry'

const symbols: Record<string, string> = {
  shift: '⇧',
  alt: '⌥',
  enter: '↵',
  escape: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
}

function KeyCombo({ keys }: { keys: string }) {
  const apple = isApple()
  return (
    <KbdGroup dir="ltr">
      {keys.split('+').map((part) => (
        <Kbd key={part} className="min-w-6">
          {part === 'mod'
            ? apple
              ? '⌘'
              : 'Ctrl'
            : (symbols[part] ?? part.toUpperCase())}
        </Kbd>
      ))}
    </KbdGroup>
  )
}

/** Lists every shortcut registered by the mounted shell and page. */
export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const shortcuts = useShortcutRegistry((state) => state.shortcuts)
  const groups = new Map<string, { keys: string; label: string }[]>()
  for (const item of shortcuts.values())
    groups.set(item.group, [...(groups.get(item.group) ?? []), item])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('shortcuts')}</DialogTitle>
          <DialogDescription>{t('shortcutsHint')}</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-5 overflow-y-auto">
          {[...groups].map(([group, items]) => (
            <section key={group} className="grid gap-1.5">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group}
              </h3>
              <dl className="grid gap-1">
                {items.map((item) => (
                  <div
                    key={item.keys}
                    className="flex items-center justify-between gap-4 rounded-md px-1 py-1 text-sm"
                  >
                    <dt>{item.label}</dt>
                    <dd>
                      <KeyCombo keys={item.keys} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
