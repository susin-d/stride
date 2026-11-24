import { EMPTY_AVATAR_VALUE, useEveAvatarContext } from './eveAvatarContext'

/** Read the avatar preferences provided by `EveAvatarProvider`. */
export function useEveAvatar() {
  const ctx = useEveAvatarContext()
  return ctx ?? EMPTY_AVATAR_VALUE
}
