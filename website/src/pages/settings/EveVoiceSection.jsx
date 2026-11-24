import { useState } from 'react'
import { AudioLines, RotateCcw, Volume2 } from 'lucide-react'
import { useSpeechVoices } from '../../hooks/useSpeechVoices'
import { saveEveSpeechPreference } from '../../lib/eveSpeechApi'
import { streamEveSpeech } from '../../lib/eveSpeechStream'
import { SectionHeading, SettingsCard } from '../../components/ui'
import {
  DEFAULT_EVE_VOICE_PREFS,
  EVE_VOICE_LANGUAGES,
  EVE_VOICE_PITCH_OPTIONS,
  EVE_VOICE_RATE_OPTIONS,
  loadEveVoicePrefs,
  saveEveVoicePrefs,
  selectVoice,
  voicesForLanguage,
} from '../../utils/speech'
import { useEveSpeechProviders } from './useEveSpeechProviders'
import { EveBrowserCapabilitiesCard, EveSpeechProviderCard } from './EveSpeechProviderCard'

const PREVIEW_TEXT = 'Hello! I’m Eve. How can I help you today?'
const SERVER_TTS_PROVIDERS = ['google', 'openrouter']

export function EveVoiceSection() {
  const { voices, voicesLoaded, sttSupported, ttsSupported } = useSpeechVoices()
  const [prefs, setPrefs] = useState(() => loadEveVoicePrefs())
  const [message, setMessage] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const providers = useEveSpeechProviders()
  const {
    sttProviders,
    ttsProviders,
    savedPreference,
    sttProvider,
    setSttProvider,
    sttModel,
    setSttModel,
    ttsProvider,
    setTtsProvider,
    ttsVoice,
    setTtsVoice,
    setSavedPreference,
    loading: loadingProviders,
  } = providers

  const languageVoices = voicesForLanguage(voices, prefs.language)
  const sttProviderDescriptor = sttProviders.find((provider) => provider.id === sttProvider)
  const ttsProviderDescriptor = ttsProviders.find((provider) => provider.id === ttsProvider)
  const sttProviderOptions = sttProviders.map(({ id, label }) => ({ value: id, label }))
  const sttModelOptions = (sttProviderDescriptor?.models || []).map(({ id, label }) => ({ value: id, label }))
  const ttsProviderOptions = ttsProviders.map(({ id, label }) => ({ value: id, label }))
  const ttsVoiceOptions = (ttsProviderDescriptor?.voices || [])
    .filter((voice) => !prefs.language || voice.language === prefs.language)
    .map(({ id, label }) => ({ value: id, label }))

  const isServerTts = SERVER_TTS_PROVIDERS.includes(ttsProvider)
  const ttsPreviewAvailable = isServerTts ? Boolean(ttsProviderDescriptor?.available) : ttsSupported
  const hasUnavailableProvidersWarning =
    savedPreference &&
    (!sttProviders.some((provider) => provider.id === savedPreference.stt_provider) ||
      !ttsProviders.some((provider) => provider.id === savedPreference.tts_provider))

  const updatePrefs = (patch, note) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    saveEveVoicePrefs(next)
    if (note) setMessage(note)
  }

  const handleLanguageChange = (event) => {
    const language = event.target.value
    const nextVoiceOptions = (ttsProviderDescriptor?.voices || []).filter(
      (voice) => voice.language === language,
    )
    setTtsVoice(
      nextVoiceOptions.some((voice) => voice.id === ttsVoice) ? ttsVoice : nextVoiceOptions[0]?.id || '',
    )
    // A new language may not have the previously chosen voice, so reset it.
    updatePrefs({ language, voiceURI: '' }, 'Voice language updated.')
  }

  const handleSttProviderChange = (providerId) => {
    const nextModels = sttProviders.find((provider) => provider.id === providerId)?.models || []
    setSttProvider(providerId)
    setSttModel(
      nextModels.some((model) => model.id === sttModel) ? sttModel : nextModels[0]?.id || '',
    )
    setMessage('')
  }

  const handleSttModelChange = (modelId) => {
    setSttModel(modelId)
    setMessage('')
  }

  const handleTtsProviderChange = (providerId) => {
    const nextVoices = (ttsProviders.find((provider) => provider.id === providerId)?.voices || []).filter(
      (voice) => !prefs.language || voice.language === prefs.language,
    )
    setTtsProvider(providerId)
    setTtsVoice(nextVoices.some((voice) => voice.id === ttsVoice) ? ttsVoice : nextVoices[0]?.id || '')
    setMessage('')
  }

  const handleTtsVoiceChange = (voiceId) => {
    setTtsVoice(voiceId)
    setMessage('')
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!sttProvider || !ttsProvider) {
      setMessage('Pick a speech provider before saving.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const data = await saveEveSpeechPreference({
        stt_provider: sttProvider,
        stt_model: sttModel,
        tts_provider: ttsProvider,
        tts_voice: ttsVoice,
      })
      setSavedPreference(data.preference || null)
      setMessage('Speech preferences saved. Eve will use these providers.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    const defaults = { ...DEFAULT_EVE_VOICE_PREFS }
    setPrefs(defaults)
    saveEveVoicePrefs(defaults)
    setMessage('Eve voice settings reset to defaults.')
  }

  const previewServerVoice = () => {
    setPreviewing(true)
    setMessage('')
    streamEveSpeech({
      text: PREVIEW_TEXT,
      language: prefs.language,
      voice: ttsVoice,
      rate: prefs.rate,
      pitch: prefs.pitch - 1,
    })
      .then(({ audio }) => {
        audio.addEventListener('ended', () => setPreviewing(false), { once: true })
        audio.addEventListener(
          'error',
          () => {
            setPreviewing(false)
            setMessage('Could not play Eve speech preview.')
          },
          { once: true },
        )
      })
      .catch((error) => {
        setPreviewing(false)
        setMessage(error.message)
      })
  }

  const previewBrowserVoice = () => {
    setPreviewing(true)
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(PREVIEW_TEXT)
    const voice = selectVoice(prefs, voices)
    if (voice) utterance.voice = voice
    utterance.lang = prefs.language
    utterance.rate = prefs.rate
    utterance.pitch = prefs.pitch
    utterance.onend = () => setPreviewing(false)
    utterance.onerror = () => setPreviewing(false)
    window.speechSynthesis.speak(utterance)
  }

  const handlePreview = () => {
    if (previewing) return
    if (isServerTts) {
      previewServerVoice()
      return
    }
    if (!ttsSupported) return
    previewBrowserVoice()
  }

  return (
    <div className="setting-section" id="settings-eve-voice">
      <SectionHeading
        title="Eve voice"
        description="Choose how Eve listens and sounds during voice calls — which speech providers she uses and the language she speaks. Provider choices are saved to your account; voice details stay on this browser."
      />

      <div className="setting-content-stack">
        <EveSpeechProviderCard
          loading={loadingProviders}
          sttProviders={sttProviders}
          ttsProviders={ttsProviders}
          sttProvider={sttProvider}
          sttModel={sttModel}
          ttsProvider={ttsProvider}
          ttsVoice={ttsVoice}
          sttProviderOptions={sttProviderOptions}
          sttModelOptions={sttModelOptions}
          ttsProviderOptions={ttsProviderOptions}
          ttsVoiceOptions={ttsVoiceOptions}
          sttProviderDescriptor={sttProviderDescriptor}
          hasUnavailableProvidersWarning={hasUnavailableProvidersWarning}
          message={message}
          saving={saving}
          onChangeSttProvider={handleSttProviderChange}
          onChangeSttModel={handleSttModelChange}
          onChangeTtsProvider={handleTtsProviderChange}
          onChangeTtsVoice={handleTtsVoiceChange}
          onSubmit={handleSave}
        />

        <SettingsCard
          className="coding-settings-card"
          icon={<Volume2 size={18} />}
          title="Voice & language"
          description="Voice input (speech recognition) and Eve's spoken replies (speech synthesis)."
        >
          <div className="coding-profile-fields">
            <label>
              <span>
                <strong>Language</strong>
                <small>Used for voice recognition and matching Eve's voice.</small>
              </span>
              <select value={prefs.language} onChange={handleLanguageChange}>
                {EVE_VOICE_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </label>

            {ttsProvider === 'browser' && (
              <label>
                <span>
                  <strong>Eve's voice</strong>
                  <small>Installed browser voices for the selected language.</small>
                </span>
                <select
                  value={prefs.voiceURI}
                  onChange={(event) => updatePrefs({ voiceURI: event.target.value })}
                  disabled={!ttsSupported || languageVoices.length === 0}
                >
                  <option value="">System default</option>
                  {languageVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
                {!voicesLoaded && <small>Loading voices…</small>}
              </label>
            )}

            <label>
              <span>
                <strong>Speaking rate</strong>
                <small>How fast Eve talks.</small>
              </span>
              <select
                value={prefs.rate}
                onChange={(event) => updatePrefs({ rate: Number(event.target.value) })}
              >
                {EVE_VOICE_RATE_OPTIONS.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate.toFixed(2)}×
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>
                <strong>Pitch</strong>
                <small>How high or low Eve's voice sounds.</small>
              </span>
              <select
                value={prefs.pitch}
                onChange={(event) => updatePrefs({ pitch: Number(event.target.value) })}
              >
                {EVE_VOICE_PITCH_OPTIONS.map((pitch) => (
                  <option key={pitch} value={pitch}>
                    {pitch.toFixed(2)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="coding-settings-footer eve-voice-footer">
            <button
              type="button"
              className="eve-voice-primary"
              onClick={handlePreview}
              disabled={!ttsPreviewAvailable || previewing}
            >
              <AudioLines size={15} />
              {previewing ? 'Speaking…' : 'Preview voice'}
            </button>
            <button type="button" className="eve-voice-reset" onClick={handleReset}>
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </SettingsCard>

        <EveBrowserCapabilitiesCard sttSupported={sttSupported} ttsSupported={ttsSupported} />
      </div>
    </div>
  )
}
