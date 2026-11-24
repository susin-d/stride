import { useEffect, useState } from 'react'
import { loadEveSpeech } from '../../lib/eveSpeechApi'

// Pick the saved value when the catalog still offers it, else the first entry.
function firstAvailable(list, saved) {
  if (list.some((entry) => entry.id === saved)) return saved
  return list[0]?.id || ''
}

/**
 * Load the server speech-provider catalog and restore the saved selection.
 * Falls back silently to the browser Web Speech API when the server offers no
 * providers, which is why the failure is reported through `loading` rather than
 * thrown.
 */
export function useEveSpeechProviders() {
  const [sttProviders, setSttProviders] = useState([])
  const [ttsProviders, setTtsProviders] = useState([])
  const [savedPreference, setSavedPreference] = useState(null)
  const [sttProvider, setSttProvider] = useState('browser')
  const [sttModel, setSttModel] = useState('')
  const [ttsProvider, setTtsProvider] = useState('browser')
  const [ttsVoice, setTtsVoice] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    loadEveSpeech()
      .then((data) => {
        if (!active) return
        const availableStt = (data.stt_providers || []).filter((provider) => provider.available)
        const availableTts = (data.tts_providers || []).filter((provider) => provider.available)
        setSttProviders(availableStt)
        setTtsProviders(availableTts)
        const preference = data.preference || null
        setSavedPreference(preference)

        const sttChoice =
          availableStt.find((provider) => provider.id === (preference?.stt_provider || '')) ||
          availableStt[0] ||
          null
        if (sttChoice) {
          setSttProvider(sttChoice.id)
          setSttModel(firstAvailable(sttChoice.models || [], preference?.stt_model))
        }

        const ttsChoice =
          availableTts.find((provider) => provider.id === (preference?.tts_provider || '')) ||
          availableTts[0] ||
          null
        if (ttsChoice) {
          setTtsProvider(ttsChoice.id)
          setTtsVoice(firstAvailable(ttsChoice.voices || [], preference?.tts_voice))
        }
      })
      .catch(() => {
        // Server providers unavailable: the section falls back to browser speech.
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return {
    sttProviders,
    ttsProviders,
    savedPreference,
    setSavedPreference,
    sttProvider,
    setSttProvider,
    sttModel,
    setSttModel,
    ttsProvider,
    setTtsProvider,
    ttsVoice,
    setTtsVoice,
    loading,
  }
}
