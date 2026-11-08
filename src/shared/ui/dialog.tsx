import { useTranslation } from 'react-i18next'
import * as React from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { XIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

const dialogSizes = {
  sm: 'sm:max-w-md',
  default: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
} as const

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = 'default',
  sectioned = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  /** Width preset; `lg` and `xl` suit tables and multi-line entry. */
  size?: keyof typeof dialogSizes
  /**
   * Fixed header and footer around a scrolling `DialogBody`, for dialogs whose
   * content can outgrow the screen. Header and footer get their own padding.
   */
  sectioned?: boolean
}) {
  const { t } = useTranslation()
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] start-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] rtl:-translate-x-[-50%] translate-y-[-50%] rounded-lg border shadow-lg duration-200',
          dialogSizes[size],
          sectioned
            ? 'flex max-h-[min(88dvh,52rem)] flex-col gap-0 overflow-hidden p-0 [&>[data-slot=dialog-header]]:border-b [&>[data-slot=dialog-header]]:px-6 [&>[data-slot=dialog-header]]:pt-6 [&>[data-slot=dialog-header]]:pb-4 [&>[data-slot=dialog-footer]]:border-t [&>[data-slot=dialog-footer]]:bg-muted/40 [&>[data-slot=dialog-footer]]:px-6 [&>[data-slot=dialog-footer]]:py-4 [&>form]:flex [&>form]:min-h-0 [&>form]:flex-1 [&>form]:flex-col [&>form>[data-slot=dialog-header]]:border-b [&>form>[data-slot=dialog-header]]:px-6 [&>form>[data-slot=dialog-header]]:pt-6 [&>form>[data-slot=dialog-header]]:pb-4 [&>form>[data-slot=dialog-footer]]:border-t [&>form>[data-slot=dialog-footer]]:bg-muted/40 [&>form>[data-slot=dialog-footer]]:px-6 [&>form>[data-slot=dialog-footer]]:py-4'
            : 'grid gap-4 p-6',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 end-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className="sr-only">{t('close')}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-start', className)}
      {...props}
    />
  )
}

/**
 * Scrolling middle of a sectioned dialog. Give `DialogContent` the `sectioned`
 * layout and put the header, this body and the footer inside: the header and
 * footer stay put while long content (many lines, long forms) scrolls.
 */
function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-4', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
