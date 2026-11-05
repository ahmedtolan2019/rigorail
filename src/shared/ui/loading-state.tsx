import { useTranslation } from 'react-i18next'
import { Spinner } from './spinner'
export function LoadingState({ updating = false }: { updating?: boolean }) {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      className="flex items-center gap-2 py-4 text-muted-foreground"
    >
      <Spinner aria-hidden="true" />
      {t(updating ? 'updating' : 'loading')}
    </div>
  )
}
