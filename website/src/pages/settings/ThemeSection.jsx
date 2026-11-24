import { Palette } from 'lucide-react'
import { SectionHeading } from '../../components/ui'

export function ThemeSection({ onNavigate }) {
  return (
    <div className="setting-section" id="settings-themes">
      <SectionHeading
        title="Themes & Appearance"
        description="Switch between monochrome White and Dark mode, and tune typography, geometry, and motion."
      />

      <div className="workspace-settings-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span className="workspace-google-mark" style={{ background: 'var(--bg-tertiary, #e5e5e5)', color: 'var(--text-primary, #0a0a0a)' }}>
            <Palette size={20} />
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary, #0a0a0a)' }}>White / Dark Mode</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #737373)' }}>
              Choose the appearance mode and adjust fonts, corner roundness, density, elevation, and motion.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => onNavigate && onNavigate('themes')}
          style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Palette size={16} /> Open Themes Page
        </button>
      </div>
    </div>
  )
}
