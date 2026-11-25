import "../styles/pages/themes-shell.css"
import "../styles/pages/themes-controls.css"
import { useRef } from 'react'
import {
  Check,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Type,
  Maximize2,
  Layout,
  Layers,
  Zap,
} from 'lucide-react'
import { PageHeader, SectionHeading } from '../components/ui'
import { StrideLogo } from '../components/StrideLogo'
import {
  useThemeCustomizer,
  THEME_MODES,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  DENSITY_OPTIONS,
  ELEVATION_OPTIONS,
  MOTION_OPTIONS,
} from '../themes'

const MODE_ICONS = { light: Sun, dark: Moon, void: Terminal }

export function ThemesPage() {
  const {
    mode,
    fontFamily,
    radius,
    density,
    elevation,
    motion,
    setMode,
    updateOption,
    resetToDefault,
    exportAppearance,
    importAppearance,
  } = useThemeCustomizer()

  const fileInputRef = useRef(null)

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(loadEvent.target?.result)
        if (!importAppearance(parsed)) alert('Invalid UI/UX configuration JSON file.')
      } catch {
        alert('Invalid UI/UX configuration JSON file.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  return (
    <section className="themes-page">
      <PageHeader
        actions={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={resetToDefault}
              title="Reset appearance settings to system defaults"
            >
              <RotateCcw size={15} />
              Reset Defaults
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={exportAppearance}
              title="Export UI/UX configuration JSON"
            >
              <Download size={15} />
              Export JSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={triggerImport}
              title="Import UI/UX configuration JSON"
            >
              <Upload size={15} />
              Import JSON
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="visually-hidden"
            />
          </>
        }
      />

      {/* 1. Appearance mode */}
      <div className="themes-section">
        <SectionHeading
          title="1. Appearance Mode"
          description="Stride ships two modes and no color presets — White and Dark, both on the same strictly monochrome ink ramp."
        />
        <div className="modes-grid">
          {THEME_MODES.map((themeMode) => {
            const ModeIcon = MODE_ICONS[themeMode.id] || Sun
            const isActive = mode === themeMode.id

            return (
              <button
                key={themeMode.id}
                type="button"
                className={`mode-card ${isActive ? 'active' : ''}`}
                onClick={() => setMode(themeMode.id)}
                aria-pressed={isActive}
              >
                <div className={`mode-card-preview is-${themeMode.id}`} aria-hidden="true">
                  <span className="mode-card-surface" />
                  <span className="mode-card-bar" />
                  <span className="mode-card-bar is-short" />
                  <span className="mode-card-fill" />
                </div>
                <div className="mode-card-info">
                  <div className="mode-card-title-row">
                    <span className="mode-card-name">
                      <ModeIcon size={15} />
                      <strong>{themeMode.name}</strong>
                    </span>
                    {isActive && <Check size={15} className="mode-card-check" />}
                  </div>
                  <small>{themeMode.description}</small>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Interface Geometry & UX Controls */}
      <div className="themes-section">
        <SectionHeading
          title="2. Interface Geometry, Motion & UX"
          description="Control font families, corner roundness, layout density, elevation depth, and motion speeds."
        />

        <div className="ux-controls-grid">
          {/* Typography */}
          <div className="ux-control-card">
            <div className="ux-card-header">
              <Type size={18} />
              <div>
                <h3>Typography &amp; Font Family</h3>
                <small>Select the global font face across all pages.</small>
              </div>
            </div>
            <select
              className="ux-select-input"
              value={fontFamily}
              onChange={(e) => updateOption('fontFamily', e.target.value)}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Corner Radius */}
          <div className="ux-control-card">
            <div className="ux-card-header">
              <Maximize2 size={18} />
              <div>
                <h3>Corner Roundness (Border Radius)</h3>
                <small>Set corner roundness for cards, inputs, and buttons.</small>
              </div>
            </div>
            <div className="ux-segment-group">
              {RADIUS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`ux-segment-btn ${radius === option.id ? 'active' : ''}`}
                  onClick={() => updateOption('radius', option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Density */}
          <div className="ux-control-card">
            <div className="ux-card-header">
              <Layout size={18} />
              <div>
                <h3>Layout Density &amp; Spacing</h3>
                <small>Adjust padding and vertical margins.</small>
              </div>
            </div>
            <div className="ux-segment-group">
              {DENSITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`ux-segment-btn ${density === option.id ? 'active' : ''}`}
                  onClick={() => updateOption('density', option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {/* Elevation Depth */}
          <div className="ux-control-card">
            <div className="ux-card-header">
              <Layers size={18} />
              <div>
                <h3>Shadow &amp; Elevation Depth</h3>
                <small>Set 3D drop-shadow and container depth levels.</small>
              </div>
            </div>
            <div className="ux-segment-group">
              {ELEVATION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`ux-segment-btn ${elevation === option.id ? 'active' : ''}`}
                  onClick={() => updateOption('elevation', option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {/* Motion & Speed */}
          <div className="ux-control-card">
            <div className="ux-card-header">
              <Zap size={18} />
              <div>
                <h3>Animation Speed &amp; Micro-Motion</h3>
                <small>Control hover transitions and animation timing.</small>
              </div>
            </div>
            <div className="ux-segment-group">
              {MOTION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`ux-segment-btn ${motion === option.id ? 'active' : ''}`}
                  onClick={() => updateOption('motion', option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Preview */}
      <div className="themes-section">
        <SectionHeading
          title="3. Live Interface Preview"
          description="Real-time view of your typography, corner roundness, shadows, motion, and mode."
        />

        <div className="live-preview-container">
          <div className="preview-header-bar">
            <div className="preview-nav-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <span className="preview-title">Stride Real-Time Studio Preview</span>
          </div>

          <div className="preview-body">
            <div className="preview-sidebar">
              <div className="preview-logo">
                <StrideLogo size={18} className="stride-logo-icon--on-fill" /> Stride
              </div>
              <div className="preview-nav-item active">Dashboard</div>
              <div className="preview-nav-item">Projects</div>
              <div className="preview-nav-item">Documents</div>
              <div className="preview-nav-item">Settings</div>
            </div>

            <div className="preview-main">
              <div className="preview-card-grid">
                <div className="preview-card">
                  <h3>Project Overview</h3>
                  <p>Typography, corners, elevation, motion, and mode update dynamically.</p>
                  <div className="preview-btn-group">
                    <button type="button" className="preview-primary-btn">
                      Primary Action
                    </button>
                    <button type="button" className="preview-secondary-btn">
                      Secondary Action
                    </button>
                  </div>
                </div>

                <div className="preview-card">
                  <h3>Status Badges</h3>
                  <div className="preview-badge-stack">
                    <span className="preview-badge badge-success">
                      <CheckCircle2 size={12} /> Active
                    </span>
                    <span className="preview-badge badge-warning">
                      <AlertTriangle size={12} /> Pending
                    </span>
                    <span className="preview-badge badge-danger">
                      <XCircle size={12} /> Critical
                    </span>
                    <span className="preview-badge badge-purple">
                      <Tag size={12} /> Feature
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
