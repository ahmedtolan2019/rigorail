import * as React from 'react'
import { cn } from '@/shared/lib/utils'

const FADE = 32

/**
 * A single row that scrolls sideways instead of wrapping (status chips, filter
 * toolbars, tab strips). Edges with hidden content fade out, so readers can see
 * there is more; a fully visible row shows no fade. Works in RTL: the fade
 * follows the physical side that hides content.
 *
 * Popovers opened from inside are portaled, so the clipping never cuts them.
 */
export function ScrollFade({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<'div'>) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [edges, setEdges] = React.useState({ left: false, right: false })
  React.useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => {
      const max = node.scrollWidth - node.clientWidth
      // RTL scrollLeft runs from 0 to -max; convert to the hidden width on the left.
      const rtl = getComputedStyle(node).direction === 'rtl'
      const hiddenLeft = rtl ? max + node.scrollLeft : node.scrollLeft
      const next = { left: hiddenLeft > 1, right: max - hiddenLeft > 1 }
      setEdges((current) =>
        current.left === next.left && current.right === next.right
          ? current
          : next,
      )
    }
    measure()
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(node)
    for (const child of node.children) observer.observe(child)
    node.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      node.removeEventListener('scroll', schedule)
    }
  }, [])
  const mask =
    edges.left || edges.right
      ? `linear-gradient(to right, ${edges.left ? 'transparent' : '#000'} 0, #000 ${edges.left ? FADE : 0}px, #000 calc(100% - ${edges.right ? FADE : 0}px), ${edges.right ? 'transparent' : '#000'} 100%)`
      : undefined
  return (
    <div
      ref={ref}
      data-slot="scroll-fade"
      data-fade-left={edges.left || undefined}
      data-fade-right={edges.right || undefined}
      className={cn(
        // Small padding keeps focus rings inside the clipped area.
        'flex min-w-0 items-center gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0',
        className,
      )}
      style={{ maskImage: mask, WebkitMaskImage: mask, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
