import { createContext, useContext } from 'react'

// Shared context object for the avatar provider. Lives in its own module so
// both the provider component and the `useEveAvatar` hook can consume it
// without a component file also exporting a hook (breaks Fast Refresh).
export const EveAvatarContext = createContext(null)

export const EMPTY_AVATAR_VALUE = {
  prefs: null,
  setPrefs: () => {},
  activeModel: null,
}

export function useEveAvatarContext() {
  return useContext(EveAvatarContext)
}

/** Resolve the avatar preferences document from the overall UI preferences. */
export function selectEveAvatarPrefs(uiPrefs) {
  // uiPrefs is the whole preferences doc; eve_avatar lives at doc.eve_avatar.
  const eveUi = uiPrefs?.eve_avatar ? uiPrefs : uiPrefs?.preferences?.eve_avatar ? uiPrefs.preferences : uiPrefs
  // CustomUIProvider stores { global_tokens, pages, eve_avatar? } at top level.
  return eveUi?.eve_avatar ?? uiPrefs?.eve_avatar ?? null
}
