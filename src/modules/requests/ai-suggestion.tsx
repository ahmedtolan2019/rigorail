import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useServices } from '@/shared/api/services'
import { useCapability } from '@/shared/capabilities/hooks'
import { useConfiguration, selectAiEnabled } from '@/shared/config/business'
import { streamSuggestion } from '@/shared/ai/stream'
import { Button } from '@/shared/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/shared/ui/alert'
import { permissions } from './permissions'
export function AiSuggestion({
  title,
  onApply,
}: {
  title: string
  onApply: (text: string) => void
}) {
  const { t, i18n } = useTranslation(),
    { api, mode, aiEnabled } = useServices()
  const access = useCapability({
      action: permissions.suggest,
      flag: 'aiSuggestions',
      entitlement: 'aiSuggestions',
    }),
    enabled = useConfiguration(selectAiEnabled)
  const [text, setText] = useState(''),
    [status, setStatus] = useState<
      'idle' | 'streaming' | 'complete' | 'cancelled' | 'error'
    >('idle')
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const available =
    aiEnabled &&
    enabled.isSuccess &&
    enabled.data === true &&
    access.status === 'allowed'
  useEffect(() => {
    if (!available) controller.current?.abort()
  }, [available])
  if (!available) return null
  async function generate() {
    controller.current?.abort()
    const active = new AbortController()
    controller.current = active
    setText('')
    setStatus('streaming')
    try {
      await streamSuggestion(
        api,
        { title, language: i18n.language },
        active.signal,
        (value) => {
          if (!active.signal.aborted) setText(value)
        },
      )
      if (!active.signal.aborted) setStatus('complete')
    } catch {
      if (controller.current === active)
        setStatus(active.signal.aborted ? 'cancelled' : 'error')
    }
  }
  return (
    <section className="assistant-panel">
      <h2>{t('aiTitle')}</h2>
      <p>{t('aiHint')}</p>
      {mode === 'demo' && <p className="muted">{t('aiDemo')}</p>}
      <div className="action-row">
        <Button
          type="button"
          variant="outline"
          disabled={status === 'streaming'}
          onClick={() => void generate()}
        >
          {t(status === 'streaming' ? 'generating' : 'generate')}
        </Button>
        {status === 'streaming' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => controller.current?.abort()}
          >
            {t('stop')}
          </Button>
        )}
      </div>
      {text && (
        <div className="suggestion" aria-label={t('suggestion')} dir="auto">
          {text}
        </div>
      )}
      <p role="status" className="muted">
        {status === 'cancelled'
          ? t('cancelled')
          : status === 'complete'
            ? t('review')
            : status === 'streaming'
              ? t('generating')
              : ''}
      </p>
      {status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>{t('error')}</AlertTitle>
          <AlertDescription>{t('unavailable')}</AlertDescription>
        </Alert>
      )}
      {status === 'complete' && (
        <div className="action-row">
          <Button
            type="button"
            onClick={() => {
              onApply(text)
              setText('')
              setStatus('idle')
            }}
          >
            {t('apply')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setText('')
              setStatus('idle')
            }}
          >
            {t('discard')}
          </Button>
        </div>
      )}
    </section>
  )
}
