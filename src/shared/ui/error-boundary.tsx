import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
function CrashFallback({ retry }: { retry: () => void }) {
  const { t } = useTranslation()
  return (
    <main className="startup" role="alert">
      <h1>{t('unexpectedError')}</h1>
      <p>{t('unexpectedErrorHint')}</p>
      <Button onClick={retry}>{t('retry')}</Button>
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
