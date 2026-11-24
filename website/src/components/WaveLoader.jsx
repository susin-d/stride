const EQ_BAR_COUNT = 24

export function WaveLoader({ label = 'Loading Stride…', detail = 'Preparing your workspace' }) {
  return (
    <div className="wave-loader" role="status" aria-live="polite">
      <div className="wave-loader-backdrop" aria-hidden="true">
        <div className="wave-loader-grid" />
      </div>
      <div className="wave-loader-eq" aria-hidden="true">
        {Array.from({ length: EQ_BAR_COUNT }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <span className="wave-loader-sr">{`${label} ${detail}`}</span>
    </div>
  )
}
