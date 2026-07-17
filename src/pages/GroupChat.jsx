import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { streamChat, buildSystemPrompt } from '../lib/gemini'
import { getInitials } from '../lib/helpers'
import './GroupChat.css'

function formatMessage(text) {
  if (!text) return ''
  const escaped = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
  return escaped.replace(/\*([^*\n]+)\*/g, '<em class="action-text">*$1*</em>')
}

export default function GroupChat() {
  const { id } = useParams()
  const navigate = useNavigate()

  const groupChat = useStore(s => s.groupChats[id])
  const characters = useStore(s => s.characters)
  const settings = useStore(s => s.settings)
  const addGroupMessage = useStore(s => s.addGroupMessage)
  const updateLastGroupMessage = useStore(s => s.updateLastGroupMessage)
  const deleteLastGroupMessage = useStore(s => s.deleteLastGroupMessage)
  const clearGroupChat = useStore(s => s.clearGroupChat)

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [speakingCharId, setSpeakingCharId] = useState(null)
  const [error, setError] = useState('')

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [groupChat?.messages?.length, isLoading])

  // Seed greetings from all characters
  useEffect(() => {
    if (groupChat && groupChat.messages.length === 0) {
      const chars = characters.filter(c => groupChat.characterIds.includes(c.id))
      chars.forEach(char => {
        if (char.greeting) {
          addGroupMessage(id, { role: 'assistant', characterId: char.id, content: char.greeting })
        }
      })
    }
  }, [id])

  if (!groupChat) {
    return (
      <div className="chat-not-found">
        <h3>Group chat not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/discover')}>Browse Characters</button>
      </div>
    )
  }

  const chars = characters.filter(c => groupChat.characterIds.includes(c.id))
  const messages = groupChat.messages || []

  // Pick which character responds — rotate based on message count, or pick based on context
  const pickResponder = (msgCount) => {
    return chars[msgCount % chars.length]
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    if (!settings.geminiApiKey) { setError('Add your Gemini API key in Settings.'); return }

    const userText = input.trim()
    setInput('')
    setError('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    addGroupMessage(id, { role: 'user', content: userText })

    // Pick next character to respond
    const responder = pickResponder(messages.length)
    setSpeakingCharId(responder.id)
    addGroupMessage(id, { role: 'assistant', characterId: responder.id, content: '' })
    setIsLoading(true)

    try {
      const systemPrompt = buildSystemPrompt({
        character: responder,
        persona: null,
        memories: [],
        nsfwEnabled: settings.nsfwEnabled,
        groupContext: `You are in a group conversation with: ${chars.map(c => c.name).join(', ')}. Other characters may also respond. Be yourself and react naturally to what's being said.`,
      })
      const history = messages.filter(m => m.content)

      await streamChat({
        apiKey: settings.geminiApiKey,
        model: settings.defaultModel || 'gemini-2.0-flash',
        systemPrompt,
        history: history.map(m => ({
          role: m.role,
          content: m.characterId
            ? `[${chars.find(c => c.id === m.characterId)?.name || 'Character'}]: ${m.content}`
            : m.content,
        })),
        userMessage: userText,
        nsfwEnabled: settings.nsfwEnabled,
        onChunk: (text) => updateLastGroupMessage(id, text),
      })
    } catch (err) {
      deleteLastGroupMessage(id)
      setError(err.message || 'Something went wrong.')
    } finally {
      setIsLoading(false)
      setSpeakingCharId(null)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="chat-layout">
      {/* Glass Header */}
      <header className="chat-header glass">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/discover')}>←</button>
        <div className="group-header-chars">
          {chars.map((c, i) => (
            <div key={c.id} className="group-header-char" style={{ zIndex: chars.length - i, marginLeft: i > 0 ? -10 : 0 }}>
              {(c.avatar || c.avatar_url) ? (
                <img src={c.avatar || c.avatar_url} alt={c.name} className="avatar avatar-sm" title={c.name} />
              ) : (
                <div className="avatar-placeholder avatar-sm" title={c.name} style={{ fontSize: '0.65rem' }}>
                  {getInitials(c.name)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="group-header-info">
          <div className="chat-header-name">{groupChat.title}</div>
          <div className="chat-header-tagline">{chars.length} characters · Group Scene</div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { if (window.confirm('Clear group chat?')) clearGroupChat(id) }}
        >✕</button>
      </header>

      {/* Messages */}
      <div className="chat-messages" id="group-chat-messages">
        {messages.map((msg, i) => {
          if (!msg.content) return null
          const isUser = msg.role === 'user'
          const char = msg.characterId ? chars.find(c => c.id === msg.characterId) : null
          return (
            <div
              key={msg.id || i}
              className={`chat-message ${isUser ? 'user' : 'ai'}`}
              style={{ animationDelay: `${Math.min(i * 20, 150)}ms` }}
            >
              {!isUser && char && (
                <div className="msg-avatar-wrap">
                  {(char.avatar || char.avatar_url) ? (
                    <img src={char.avatar || char.avatar_url} alt={char.name} className="avatar avatar-xs" />
                  ) : (
                    <div className="avatar-placeholder avatar-xs" style={{ fontSize: '0.65rem' }}>
                      {getInitials(char.name)}
                    </div>
                  )}
                </div>
              )}
              <div className="msg-body">
                {!isUser && char && <div className="msg-speaker">{char.name}</div>}
                <div
                  className="msg-text"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                <div className="msg-meta">
                  <span className="msg-time">
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isLoading && speakingCharId && (() => {
          const speaking = chars.find(c => c.id === speakingCharId)
          return (
            <div className="chat-message ai">
              <div className="msg-avatar-wrap">
                {speaking && (speaking.avatar || speaking.avatar_url) ? (
                  <img src={speaking.avatar || speaking.avatar_url} alt="" className="avatar avatar-xs" />
                ) : (
                  <div className="avatar-placeholder avatar-xs" style={{ fontSize: '0.65rem' }}>
                    {getInitials(speaking?.name || '?')}
                  </div>
                )}
              </div>
              <div className="msg-body">
                <div className="msg-speaker">{speaking?.name}</div>
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )
        })()}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chat-error animate-fade-in">
          <span>⚠</span><span>{error}</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/settings')}>Settings →</button>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area glass">
        <div className="chat-input-row">
          <textarea
            ref={textareaRef}
            data-testid="group-chat-input"
            className="chat-input"
            placeholder="Speak to the group…"
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
            data-testid="group-send-btn"
            className="btn btn-primary btn-sm chat-send-btn"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <span className="spinner" /> : '→'}
          </button>
        </div>
        <div className="chat-input-hint">Characters take turns responding · Enter to send</div>
      </div>
    </div>
  )
}
