import { useMemo } from 'react'
import { useCustomUI } from '../../../hooks/useCustomUI'
import { useAvatarPref } from './useAvatarPref'
import { EveAvatarContext, selectEveAvatarPrefs } from './eveAvatarContext'

export function EveAvatarProvider({ children }) {
  const { prefs: uiPrefs } = useCustomUI() || {}
  const rawEve = selectEveAvatarPrefs(uiPrefs)
  const { prefs, setPrefs, activeModel } = useAvatarPref({ uiPrefs: rawEve ? { eve_avatar: rawEve } : null })

  const value = useMemo(() => ({ prefs, setPrefs, activeModel, rawEve }), [activeModel, prefs, rawEve, setPrefs])
  return <EveAvatarContext.Provider value={value}>{children}</EveAvatarContext.Provider>
}
