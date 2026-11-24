import { useEffect, useState, useCallback } from 'react'
import {
  DEFAULT_APPEARANCE,
  applyTheme,
  readStoredMode,
  resetThemeVariables,
  resolveMode,
} from '../themes/themeApplicator'
import { CUSTOM_THEME_KEY as STORAGE_KEY, themeExportFilename } from '../lib/storageKeys'

const APPEARANCE_KEYS = ['fontFamily', 'radius', 'density', 'elevation', 'motion']

function sanitizeAppearance(data, fallbackMode) {
  const next = { mode: resolveMode(data?.mode ?? fallbackMode) }
  APPEARANCE_KEYS.forEach((key) => {
    next[key] = data?.[key] || DEFAULT_APPEARANCE[key]
  })
  return next
}

function readStoredAppearance() {
  const fallbackMode = readStoredMode()
  let saved = null
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    /* corrupt entry — fall through to defaults */
  }
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_APPEARANCE, mode: fallbackMode }
  return sanitizeAppearance(saved, fallbackMode)
}

export function useThemeCustomizer() {
  const [appearance, setAppearance] = useState(readStoredAppearance)

  useEffect(() => {
    applyTheme(appearance)
  }, [appearance])

  useEffect(() => {
    const handleExternalThemeChange = (event) => {
      if (event.detail && typeof event.detail === 'object') {
        setAppearance((prev) => ({ ...prev, ...event.detail }))
      }
    }
    window.addEventListener('stride:theme-change', handleExternalThemeChange)
    return () => {
      window.removeEventListener('stride:theme-change', handleExternalThemeChange)
    }
  }, [])

  const persist = useCallback((updater) => {
    setAppearance((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable — in-memory appearance still applies this session */
      }
      applyTheme(next)
      window.dispatchEvent(new CustomEvent('stride:theme-change', { detail: next }))
      return next
    })
  }, [])

  const setMode = useCallback(
    (modeId) => persist((prev) => ({ ...prev, mode: resolveMode(modeId) })),
    [persist],
  )

  const updateOption = useCallback(
    (optionKey, value) => {
      if (!APPEARANCE_KEYS.includes(optionKey)) return
      persist((prev) => ({ ...prev, [optionKey]: value }))
    },
    [persist],
  )

  const resetToDefault = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable — nothing to clear */
    }
    resetThemeVariables()
    setAppearance({ ...DEFAULT_APPEARANCE, mode: readStoredMode() })
  }, [])

  const exportAppearance = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(appearance, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', themeExportFilename(appearance.mode))
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [appearance])

  const importAppearance = useCallback(
    (data) => {
      if (!data || typeof data !== 'object') return false
      persist(() => sanitizeAppearance(data, readStoredMode()))
      return true
    },
    [persist],
  )

  return {
    mode: appearance.mode,
    fontFamily: appearance.fontFamily,
    radius: appearance.radius,
    density: appearance.density,
    elevation: appearance.elevation,
    motion: appearance.motion,
    setMode,
    updateOption,
    resetToDefault,
    exportAppearance,
    importAppearance,
  }
}
