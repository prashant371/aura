import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { streamChat, buildSystemPrompt, extractMemories } from '../lib/gemini'
import { getInitials } from '../lib/helpers'
import './ChatPage.css'

function formatMessage(text) {
  if (!text) return ''
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
  // *action text* → italic terracotta
  return escaped.replace(/\*([^*\n]+)\*/g, '<em class="action-text">*$1*</em>')
}

function speakText(text, voice = 'alloy') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const clean = text
    .replace(/\*[^*]*\*/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .slice(0, 500)
  const utt = new SpeechSynthesisUtterance(clean)
  const voices = window.speechSynthesis.getVoices()
  // Try to pick a matching voice by name hint
  const voiceMap = { nova: 'female', shimmer: 'female', onyx: 'male', echo: 'male', fable: 'british' }
  const hint = voiceMap[voice] || ''
  const match = voices.find(v => hint && v.name.toLowerCase().includes(hint)) || voices[0]
  if (match) utt.voice = match
  utt.rate = 0.9
  utt.pitch = 1
  window.speechSynthesis.speak(utt)
}

const EMPTY_ARRAY = []

export default function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const characters = useStore(s => s.characters)
  const character = characters.find(c => c.id === id)
  const chats = useStore(s => s.chats)
  const messages = chats[id] || EMPTY_ARRAY
  const memoriesMap = useStore(s => s.memories)
  const memories = memoriesMap[id] || EMPTY_ARRAY
  const settings = useStore(s => s.settings)
  const scenes = useStore(s => s.scenes)
  const personas = useStore(s => s.personas)
  const activePersonaId = useStore(s => s.activePersonaId)
  const addMessage = useStore(s => s.addMessage)
  const updateLastMessage = useStore(s => s.updateLastMessage)
  const deleteLastMessage = useStore(s => s.deleteLastMessage)
  const clearChat = useStore(s => s.clearChat)
  const addMemory = useStore(s => s.addMemory)

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [showImageModal, setShowImageModal] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageGenerating, setImageGenerating] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const activePersona = personas.find(p => p.id === activePersonaId)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages.length, isLoading])

  // Seed greeting
  useEffect(() => {
    if (character && messages.length === 0 && character.greeting) {
      addMessage(id, { role: 'assistant', content: character.greeting })
    }
  }, [id])

  if (!character) {
    return (
      <div className="chat-not-found">
        <h3>Character not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/discover')}>Browse Characters</button>
      </div>
    )
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    if (!settings.geminiApiKey) {
      setError('Add your Gemini API key in Settings to chat.')
      return
    }

    const userText = input.trim()
    setInput('')
    setError('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    addMessage(id, { role: 'user', content: userText })
    addMessage(id, { role: 'assistant', content: '' })
    setIsLoading(true)

    try {
      const systemPrompt = buildSystemPrompt({
        character,
        persona: activePersona,
        memories,
        nsfwEnabled: settings.nsfwEnabled,
      })
      const history = messages.filter(m => m.content)
      const fullText = await streamChat({
        apiKey: settings.geminiApiKey,
        model: settings.defaultModel || 'gemini-2.0-flash',
        systemPrompt,
        history,
        userMessage: userText,
        nsfwEnabled: settings.nsfwEnabled,
        onChunk: (text) => updateLastMessage(id, text),
      })

      if (memoryEnabled && fullText) {
        extractMemories({
          apiKey: settings.geminiApiKey,
          model: settings.defaultModel || 'gemini-2.0-flash',
          userMessage: userText,
          assistantResponse: fullText,
          existingMemories: memories,
        }).then(facts => {
          facts.forEach(fact => addMemory(id, fact))
        }).catch(() => {})
      }
    } catch (err) {
      deleteLastMessage(id)
      const msg = err.message || 'Something went wrong.'
      setError(msg.includes('quota') || msg.includes('429') ? '⏳ Rate limit — wait a moment.' : msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleRegenerate = async () => {
    if (isLoading || messages.length < 2) return
    if (!settings.geminiApiKey) { setError('Add API key in Settings.'); return }
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    deleteLastMessage(id)
    addMessage(id, { role: 'assistant', content: '' })
    setIsLoading(true)
    setError('')
    try {
      const systemPrompt = buildSystemPrompt({ character, persona: activePersona, memories, nsfwEnabled: settings.nsfwEnabled })
      const history = messages.filter(m => m.content).slice(0, -1)
      await streamChat({
        apiKey: settings.geminiApiKey,
        model: settings.defaultModel || 'gemini-2.0-flash',
        systemPrompt, history,
        userMessage: lastUser.content,
        nsfwEnabled: settings.nsfwEnabled,
        onChunk: (text) => updateLastMessage(id, text),
      })
    } catch (err) {
      deleteLastMessage(id)
      setError(err.message || 'Regeneration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageGen = async () => {
    if (!imagePrompt.trim() || !settings.geminiApiKey) return
    setImageGenerating(true)
    try {
      const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
      const url = `${BASE_URL}/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${settings.geminiApiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${imagePrompt}. Cinematic, dramatic lighting, high quality.` }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })
      })
      const data = await res.json()
      const imgPart = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
      if (imgPart) {
        const src = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`
        addMessage(id, { role: 'user', content: `[Image generated: ${imagePrompt}]`, imageUrl: src })
        setShowImageModal(false)
        setImagePrompt('')
      } else {
        setError('Image generation failed — try a different prompt or model.')
      }
    } catch (e) {
      setError('Image generation error: ' + e.message)
    } finally {
      setImageGenerating(false)
    }
  }

  return (
    <div className="chat-layout">
      {/* Glass Header */}
      <header className="chat-header glass">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/discover')} title="Back">
          ←
        </button>
        <div className="chat-header-char">
          {(character.avatar || character.avatar_url) ? (
            <img
              src={character.avatar || character.avatar_url}
              alt={character.name}
              className="avatar avatar-sm"
            />
          ) : (
            <div className="avatar-placeholder avatar-sm" style={{ fontSize: '0.75rem' }}>
              {getInitials(character.name)}
            </div>
          )}
          <div>
            <div className="chat-header-name">{character.name}</div>
            {character.tagline && <div className="chat-header-tagline">{character.tagline}</div>}
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            data-testid="memory-toggle-btn"
            className={`btn btn-sm ${memoryEnabled ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setMemoryEnabled(!memoryEnabled)}
            title={memoryEnabled ? 'Memory ON' : 'Memory OFF'}
          >
            🧠
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { if (window.confirm('Clear chat?')) clearChat(id) }}
            title="Clear Chat"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="chat-messages" id="chat-messages">
        {messages.map((msg, i) => {
          if (!msg.content && !msg.imageUrl) return null
          const isUser = msg.role === 'user'
          return (
            <div
              key={msg.id || i}
              className={`chat-message ${isUser ? 'user' : 'ai'}`}
              style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
            >
              {!isUser && (
                <div className="msg-avatar-wrap">
                  {(character.avatar || character.avatar_url) ? (
                    <img
                      src={character.avatar || character.avatar_url}
                      alt={character.name}
                      className="avatar avatar-xs"
                    />
                  ) : (
                    <div className="avatar-placeholder avatar-xs" style={{ fontSize: '0.65rem' }}>
                      {getInitials(character.name)}
                    </div>
                  )}
                </div>
              )}
              <div className="msg-body">
                {!isUser && <div className="msg-speaker">{character.name}</div>}
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Generated" className="msg-image" />
                )}
                {msg.content && (
                  <div
                    className="msg-text"
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                )}
                <div className="msg-meta">
                  <span className="msg-time">
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!isUser && settings.voiceEnabled && (
                    <button
                      data-testid="voice-play-btn"
                      className="msg-voice-btn"
                      onClick={() => speakText(msg.content, character.voice || 'alloy')}
                      title="Play voice"
                    >
                      ▶
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="chat-message ai">
            <div className="msg-avatar-wrap">
              {(character.avatar || character.avatar_url) ? (
                <img src={character.avatar || character.avatar_url} alt="" className="avatar avatar-xs" />
              ) : (
                <div className="avatar-placeholder avatar-xs" style={{ fontSize: '0.65rem' }}>
                  {getInitials(character.name)}
                </div>
              )}
            </div>
            <div className="msg-body">
              <div className="msg-speaker">{character.name}</div>
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="chat-error animate-fade-in">
          <span>⚠</span>
          <span>{error}</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/settings')}>
            Settings →
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area glass">
        <div className="chat-input-row">
          <button
            data-testid="image-gen-btn"
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setShowImageModal(true)}
            title="Generate image"
          >
            🖼
          </button>
          <textarea
            ref={textareaRef}
            data-testid="chat-input"
            className="chat-input"
            placeholder={`Message ${character.name}…`}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={handleRegenerate}
            disabled={isLoading || messages.length < 2}
            title="Regenerate"
          >
            ↺
          </button>
          <button
            data-testid="send-btn"
            className="btn btn-primary btn-sm chat-send-btn"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <span className="spinner" /> : '→'}
          </button>
        </div>
        <div className="chat-input-hint">Enter to send · Shift+Enter for new line</div>
      </div>

      {/* Image Generation Modal */}
      {showImageModal && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Generate Image</h3>
            <p>Describe an image to add to the chat</p>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Image Prompt</label>
              <textarea
                className="textarea"
                style={{ border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)', padding: 12 }}
                placeholder="e.g. a moonlit forest, cinematic, dark fantasy…"
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowImageModal(false)}>Cancel</button>
              <button
                data-testid="generate-image-btn"
                className="btn btn-primary"
                onClick={handleImageGen}
                disabled={imageGenerating || !imagePrompt.trim()}
              >
                {imageGenerating ? <><span className="spinner" /> Generating…</> : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
