import { useState } from 'react'
import useStore from '../store/useStore'
import { VOICES } from '../lib/presets'
import { downloadJSON } from '../lib/helpers'
import './Settings.css'

const MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
]

export default function Settings() {
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)
  const characters = useStore(s => s.characters)
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)
  const chats = useStore(s => s.chats)
  const memories = useStore(s => s.memories)

  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '')
  const [model, setModel] = useState(settings.defaultModel || 'gemini-2.0-flash')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings({ geminiApiKey: apiKey.trim(), defaultModel: model })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleNSFW = () => {
    const next = !settings.nsfwEnabled
    updateSettings({ nsfwEnabled: next })
  }

  const toggleVoice = () => {
    updateSettings({ voiceEnabled: !settings.voiceEnabled })
  }

  const handleExport = () => {
    downloadJSON({ characters: characters.filter(c => !c.is_preset), chats, memories, exportedAt: new Date().toISOString() }, `aura-export-${Date.now()}.json`)
  }

  const handleClearAll = () => {
    if (window.confirm('Delete ALL your characters, chats, and memories? This cannot be undone.')) {
      ['cv_characters', 'cv_chats', 'cv_memories', 'cv_scenes', 'cv_personas', 'cv_group_chats'].forEach(k => localStorage.removeItem(k))
      window.location.reload()
    }
  }

  const totalMessages = Object.values(chats).reduce((a, m) => a + m.length, 0)

  return (
    <div className="page-wrapper">
      <div className="container settings-container">

        <div className="settings-header animate-fade-up">
          <div className="overline">Configuration</div>
          <h1>Settings</h1>
        </div>

        {/* Profile */}
        {user && (
          <section className="settings-section animate-fade-up">
            <div className="settings-section-title overline">Profile</div>
            <div className="settings-profile">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar avatar-md" />
              ) : (
                <div className="avatar-placeholder avatar-md">{user.name?.[0]}</div>
              )}
              <div>
                <div className="settings-profile-name">{user.name}</div>
                <div className="settings-profile-email">{user.email}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={logout} style={{ marginLeft: 'auto' }}>
                Sign Out
              </button>
            </div>
          </section>
        )}

        {/* API Key */}
        <section className="settings-section animate-fade-up">
          <div className="settings-section-title overline">Gemini API Key</div>
          <p style={{ marginBottom: 20 }}>
            Required for AI chat. Get a free key at{' '}
            <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer">
              aistudio.google.com
            </a>
          </p>

          <div className="form-group">
            <label className="form-label">API Key</label>
            <div className="api-key-row">
              <input
                data-testid="api-key-input"
                type={showKey ? 'text' : 'password'}
                className="input"
                placeholder="AIzaSy…"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <button className="btn btn-ghost btn-sm" onClick={() => setShowKey(!showKey)} type="button">
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            {apiKey && (
              <div className="api-key-status">
                <span className="status-dot" />
                API key configured
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label">Model</label>
            <select
              data-testid="model-select"
              className="select"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px' }}
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <button
            data-testid="save-settings-btn"
            className={`btn btn-primary ${saved ? '' : ''}`}
            onClick={handleSave}
            style={{ marginTop: 24 }}
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </section>

        {/* Content & Voice */}
        <section className="settings-section animate-fade-up">
          <div className="settings-section-title overline">Content & Voice</div>

          <div className="settings-toggle-row">
            <div>
              <div className="settings-toggle-label">NSFW Content</div>
              <div className="settings-toggle-sub">Remove safety filters for mature themes. Use responsibly.</div>
            </div>
            <button
              data-testid="nsfw-toggle"
              className={`toggle-btn ${settings.nsfwEnabled ? 'on' : ''}`}
              onClick={toggleNSFW}
              aria-label="Toggle NSFW"
            >
              <span className="toggle-knob" />
            </button>
          </div>

          <div className="settings-divider" />

          <div className="settings-toggle-row">
            <div>
              <div className="settings-toggle-label">Voice Playback</div>
              <div className="settings-toggle-sub">Show voice play buttons on AI messages (uses Web Speech API).</div>
            </div>
            <button
              data-testid="voice-toggle"
              className={`toggle-btn ${settings.voiceEnabled ? 'on' : ''}`}
              onClick={toggleVoice}
              aria-label="Toggle voice"
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="settings-section animate-fade-up">
          <div className="settings-section-title overline">Your Data</div>
          <div className="data-stats">
            {[
              { label: 'Characters', value: characters.filter(c => !c.is_preset).length },
              { label: 'Messages', value: totalMessages },
              { label: 'Memories', value: Object.values(memories).reduce((a, m) => a + m.length, 0) },
            ].map(s => (
              <div key={s.label} className="data-stat">
                <span className="data-stat-num">{s.value}</span>
                <span className="data-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Import/Export + Danger */}
        <section className="settings-section animate-fade-up">
          <div className="settings-section-title overline">Data Management</div>
          <div className="settings-actions-row">
            <button data-testid="export-btn" className="btn btn-secondary" onClick={handleExport}>
              Export Data
            </button>
          </div>
          <div className="settings-divider" style={{ marginTop: 24 }} />
          <div>
            <div className="settings-toggle-label" style={{ color: '#ef4444', marginBottom: 8 }}>Danger Zone</div>
            <button data-testid="clear-all-btn" className="btn btn-danger" onClick={handleClearAll}>
              Clear All Data
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
