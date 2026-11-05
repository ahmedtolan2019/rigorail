import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

/** Titled showcase block used by every design-system section. */
export function Showcase({
  title,
  hint,
  children,
  className,
}: {
  title: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    // min-w-0 lets wide content (tables, code) scroll inside instead of widening the grid.
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {hint && <CardDescription>{hint}</CardDescription>}
      </CardHeader>
      <CardContent className={className}>{children}</CardContent>
    </Card>
  )
}
