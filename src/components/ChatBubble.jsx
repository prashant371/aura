import './ChatBubble.css'

export default function ChatBubble({ message, characterName, characterAvatar, isUser }) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`chat-bubble-wrap ${isUser ? 'user-wrap' : 'assistant-wrap'}`}>
      {isAssistant && (
        <div className="bubble-avatar">
          {characterAvatar
            ? <img src={characterAvatar} alt={characterName} className="avatar avatar-sm" />
            : <div className="avatar-placeholder avatar-sm" style={{ fontSize: '0.7rem' }}>
                {characterName?.[0]?.toUpperCase() || '?'}
              </div>
          }
        </div>
      )}

      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
        {isAssistant && (
          <span className="bubble-name">{characterName}</span>
        )}
        <p className="bubble-content">{message.content}</p>
        {message.timestamp && (
          <span className="bubble-time">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {isUser && (
        <div className="bubble-avatar user-bubble-avatar">
          <div className="avatar-placeholder avatar-sm" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', fontSize: '0.7rem' }}>
            U
          </div>
        </div>
      )}
    </div>
  )
}

export function TypingIndicator({ characterName, characterAvatar }) {
  return (
    <div className="chat-bubble-wrap assistant-wrap animate-fade-in">
      <div className="bubble-avatar">
        {characterAvatar
          ? <img src={characterAvatar} alt={characterName} className="avatar avatar-sm" />
          : <div className="avatar-placeholder avatar-sm" style={{ fontSize: '0.7rem' }}>
              {characterName?.[0]?.toUpperCase() || '?'}
            </div>
        }
      </div>
      <div className="chat-bubble chat-bubble-assistant typing-bubble">
        <span className="bubble-name">{characterName}</span>
        <div className="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  )
}
