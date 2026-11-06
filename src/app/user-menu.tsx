import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ChevronsUpDown,
  LogOut,
  Palette,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useServices } from '@/shared/api/services'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/sidebar'

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/** Account menu: profile, settings shortcuts and sign-out. */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const { session, mode, signOut } = useServices()
  const [signingOut, setSigningOut] = useState(false)
  const avatar = (
    <Avatar className="size-8 rounded-lg">
      <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
        {initials(session.user.name)}
      </AvatarFallback>
    </Avatar>
  )
  const workspace =
    mode === 'demo'
      ? t(session.workspace.id === 'north' ? 'north' : 'south')
      : session.workspace.name
  const content = (
    <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
      <DropdownMenuLabel className="flex items-center gap-2 font-normal">
        {avatar}
        <span className="grid min-w-0 leading-tight">
          <span className="truncate font-medium">{session.user.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {session.user.email ?? workspace}
          </span>
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link to="/account">
            <UserRound />
            {t('account:navigation')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/appearance">
            <Palette />
            {t('appearance:navigation')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/access">
            <ShieldCheck />
            {t('access:navigation')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={signingOut}
        onSelect={async () => {
          setSigningOut(true)
          try {
            await signOut()
          } catch {
            toast.error(t('account:signOutFailed'))
            setSigningOut(false)
          }
        }}
      >
        <LogOut />
        {t('account:signOut')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
  if (compact)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            aria-label={t('account')}
          >
            {avatar}
          </Button>
        </DropdownMenuTrigger>
        {content}
      </DropdownMenu>
    )
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
              tooltip={session.user.name}
            >
              {avatar}
              <span className="grid min-w-0 flex-1 text-start leading-tight">
                <span className="truncate font-medium">
                  {session.user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {workspace}
                </span>
              </span>
              <ChevronsUpDown className="ms-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {content}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
