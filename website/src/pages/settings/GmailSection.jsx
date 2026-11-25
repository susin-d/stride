import { useEffect, useState } from 'react'
import { Check, Copy, Mail } from 'lucide-react'
import { SettingsCard } from '../../components/ui'
import { getSchedulableWebhookInfo } from '../../lib/schedulableMailApi'
import { API_URL } from '../../lib/request'

function buildWebhookUrl(endpointPath = '/api/webhooks/schedulable-email') {
  const base = (API_URL || '').replace(/\/api\/v1\/?$/, '')
  if (base.startsWith('http')) {
    return `${base}${endpointPath}`
  }
  return `${window.location.origin}${endpointPath}`
}

export function GmailSection() {
  const [info, setInfo] = useState({ endpoint: '/api/webhooks/schedulable-email', secret_configured: false })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getSchedulableWebhookInfo()
      .then((data) => {
        if (data?.endpoint) setInfo(data)
      })
      .catch(() => {})
  }, [])

  const fullUrl = buildWebhookUrl(info.endpoint)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Ignore clipboard failures in restricted environments
    }
  }

  return (
    <SettingsCard
      icon={Mail}
      title="Email Scheduler Webhook"
      description="Receive schedulable emails from Google Workspace Studio for Calendar, Todo, and Eve Scheduler (no Gmail OAuth required)."
    >
      <div className="integration-webhook-summary">
        <div className="integration-webhook-row">
          <span className="integration-webhook-label">POST Endpoint</span>
          <code className="integration-webhook-url">{fullUrl}</code>
          <button type="button" className="secondary-button" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="integration-webhook-hint">
          {info.secret_configured
            ? 'X-Webhook-Secret header verification is enabled.'
            : 'Optional X-Webhook-Secret header verification is currently disabled (WEBHOOK_SECRET unset).'}
        </p>
      </div>
    </SettingsCard>
  )
}
