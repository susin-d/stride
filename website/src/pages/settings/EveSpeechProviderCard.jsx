import { Bot, Mic, MicOff, Save, Volume2 } from 'lucide-react'
import { CustomDropdown, SettingsCard } from '../../components/ui'

const MESSAGE_STYLE = { padding: '18px 22px' }

/** Speech provider + model + voice selectors, saved to the account. */
export function EveSpeechProviderCard({
  loading,
  sttProviders,
  ttsProviders,
  sttProvider,
  sttModel,
  ttsProvider,
  ttsVoice,
  sttProviderOptions,
  sttModelOptions,
  ttsProviderOptions,
  ttsVoiceOptions,
  sttProviderDescriptor,
  hasUnavailableProvidersWarning,
  message,
  saving,
  onChangeSttProvider,
  onChangeSttModel,
  onChangeTtsProvider,
  onChangeTtsVoice,
  onSubmit,
}) {
  return (
    <SettingsCard
      as="form"
      className="coding-settings-card"
      onSubmit={onSubmit}
      icon={<Bot size={18} />}
      title="Speech provider"
      description="Which services run Eve's speech recognition and speech synthesis."
    >
      {loading ? (
        <p className="hackathon-source-message" role="status" style={MESSAGE_STYLE}>
          Loading speech provider options…
        </p>
      ) : sttProviders.length === 0 && ttsProviders.length === 0 ? (
        <p className="hackathon-source-message" role="status" style={MESSAGE_STYLE}>
          No server speech provider is configured. Add{' '}
          <code>DEEPGRAM_API_KEY</code>, <code>GROQ_API_KEY</code>,{' '}
          <code>GOOGLE_CLOUD_TTS_API_KEY</code>, or <code>OPENROUTER_API_KEY</code>{' '}
          to the server to enable server-side Eve voice. Eve falls back to this
          browser's built-in speech.
        </p>
      ) : (
        <>
          <div className="ai-models-fields">
            <label>
              <span>
                <strong>Speech recognition</strong>
                <small>Which service listens during Eve voice calls.</small>
              </span>
              <CustomDropdown
                value={sttProvider}
                options={sttProviderOptions}
                onChange={onChangeSttProvider}
                ariaLabel="Speech recognition provider"
              />
            </label>
            {(sttProviderDescriptor?.models || []).length > 0 && (
              <label>
                <span>
                  <strong>Recognition model</strong>
                  <small>Which model transcribes your speech.</small>
                </span>
                <CustomDropdown
                  value={sttModel}
                  options={sttModelOptions}
                  onChange={onChangeSttModel}
                  ariaLabel="Speech recognition model"
                />
              </label>
            )}
            <label>
              <span>
                <strong>Speech synthesis</strong>
                <small>Which service speaks Eve's replies.</small>
              </span>
              <CustomDropdown
                value={ttsProvider}
                options={ttsProviderOptions}
                onChange={onChangeTtsProvider}
                ariaLabel="Speech synthesis provider"
              />
            </label>
            {ttsProvider === 'google' && (
              <label>
                <span>
                  <strong>Synthesis voice</strong>
                  <small>Which Google Cloud voice Eve uses for the selected language.</small>
                </span>
                <CustomDropdown
                  value={ttsVoice}
                  options={ttsVoiceOptions}
                  onChange={onChangeTtsVoice}
                  ariaLabel="Speech synthesis voice"
                />
              </label>
            )}
            {ttsProvider === 'openrouter' && (
              <label>
                <span>
                  <strong>Voice hint</strong>
                  <small>Optional voice id for Fish S2.1 Pro Free (e.g. alloy). Leave empty for default.</small>
                </span>
                <input
                  className="eve-voice-voice-hint"
                  value={ttsVoice}
                  onChange={(event) => onChangeTtsVoice(event.target.value)}
                  placeholder="alloy (default)"
                  aria-label="OpenRouter TTS voice"
                />
              </label>
            )}
          </div>

          {hasUnavailableProvidersWarning && (
            <p className="hackathon-source-message" role="status" style={{ padding: '0 22px 12px', margin: 0 }}>
              A saved provider has no API key configured on the server, so Eve
              will fall back to this browser's built-in speech.
            </p>
          )}

          <div className="coding-settings-footer">
            {message && <p role="status">{message}</p>}
            <button type="submit" disabled={saving}>
              <Save size={15} />
              {saving ? 'Saving…' : 'Save speech preferences'}
            </button>
          </div>
        </>
      )}
    </SettingsCard>
  )
}

/** Browser capabilities report — never mutates, no actions. */
export function EveBrowserCapabilitiesCard({ sttSupported, ttsSupported }) {
  return (
    <SettingsCard
      className="coding-settings-card"
      icon={<Mic size={18} />}
      title="Browser capabilities"
      description="What this browser supports for Eve voice calls."
    >
      <div className="eve-voice-capabilities">
        <span className={sttSupported ? 'supported' : 'unsupported'}>
          {sttSupported ? <Mic size={15} /> : <MicOff size={15} />}
          {sttSupported
            ? 'Speech recognition is supported'
            : 'Speech recognition is not supported in this browser'}
        </span>
        <span className={ttsSupported ? 'supported' : 'unsupported'}>
          <Volume2 size={15} />
          {ttsSupported
            ? 'Speech synthesis is supported'
            : 'Speech synthesis is not supported in this browser'}
        </span>
      </div>
    </SettingsCard>
  )
}
