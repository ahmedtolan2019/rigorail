import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'
import { Button } from './button'
function CrashFallback({ retry }: { retry: () => void }) {
  const { t } = useTranslation()
  return (
    <main
      className="grid min-h-svh place-items-center bg-background p-6"
      role="alert"
    >
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" />
        </span>
        <h1>{t('unexpectedError')}</h1>
        <p className="text-muted-foreground">{t('unexpectedErrorHint')}</p>
        <Button onClick={retry}>{t('retry')}</Button>
      </div>
    </main>
  )
}
export class AppErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: unknown) => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    this.props.onError?.(error)
  }
  render() {
    return this.state.failed ? (
      <CrashFallback retry={() => this.setState({ failed: false })} />
    ) : (
      this.props.children
    )
  }
}
