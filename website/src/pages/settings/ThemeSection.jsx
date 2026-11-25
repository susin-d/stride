import { Palette } from 'lucide-react'
import { SettingsCard, SettingsSection } from '../../components/ui'

export function ThemeSection({ onNavigate }) {
  return (
    <SettingsSection
      id="settings-themes"
      heading="Themes & Appearance"
      description="Switch between monochrome White and Dark mode, and tune typography, geometry, and motion."
    >
      <SettingsCard
        icon={<Palette size={18} />}
        title="White / Dark Mode"
        description="Choose the appearance mode and adjust fonts, corner roundness, density, elevation, and motion."
        action={
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate?.('themes')}
          >
            <Palette size={16} /> Open Themes Page
          </button>
        }
      />
    </SettingsSection>
  )
}
