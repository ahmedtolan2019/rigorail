import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'

/**
 * Thin indeterminate bar while a route chunk or loader is pending. It mounts only
 * after a short delay (fast navigations never flash) and unmounts when idle, so no
 * animation runs in the background.
 */
export function RouteProgress() {
  const pending = useRouterState({
    select: (state) => state.status === 'pending',
  })
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!pending) {
      setVisible(false)
      return
    }
    const timer = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(timer)
  }, [pending])
  if (!visible) return null
  return <ProgressBar className="fixed inset-x-0 top-0 z-50" />
}

/** Clipped and paint-contained so the moving bar never widens the layout viewport. */
export function ProgressBar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-0.5 animate-in overflow-clip duration-300 fade-in-0 [contain:strict] ${className ?? ''}`}
    >
      <div className="h-full w-1/2 animate-progress rounded-full bg-primary" />
    </div>
  )
}
