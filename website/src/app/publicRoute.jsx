import { Suspense } from 'react'
import { NetworkStatus } from '../components/NetworkStatus'
import { WaveLoader } from '../components/WaveLoader'

export function publicRoute(content) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <NetworkStatus />
      <Suspense fallback={<WaveLoader />}>{content}</Suspense>
    </>
  )
}
