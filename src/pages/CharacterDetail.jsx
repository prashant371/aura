import { useParams, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { useCharacter, useMessages, useMemories } from '../lib/hooks'
import { getInitials, CATEGORY_COLORS, formatDate } from '../lib/helpers'
import './CharacterDetail.css'

export default function CharacterDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const character = useCharacter(id)
  const messages = useMessages(id)
  const memories = useMemories(id)
  const deleteCharacter = useStore(s => s.deleteCharacter)

  if (!character) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">😕</div>
            <h3>Character not found</h3>
            <button className="btn btn-primary" onClick={() => navigate('/')}>← Go Home</button>
          </div>
        </div>
      </div>
    )
  }

  const msgCount = messages.length
  const memCount = memories.length

  const handleDelete = () => {
    if (window.confirm(`Delete "${character.name}"? This will also delete all chat history and memories.`)) {
      deleteCharacter(id)
      navigate('/')
    }
  }

  return (
    <div className="page-wrapper">
      <div className="container char-detail-container">
        <button className="btn btn-ghost btn-sm back-btn animate-fade-in" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* Hero Card */}
        <div className="char-detail-hero glass-card animate-fade-in">
          <div className="char-detail-avatar-wrap">
            {character.avatar
              ? <img src={character.avatar} alt={character.name} className="char-detail-avatar" />
              : <div className="avatar-placeholder char-detail-avatar" style={{ background: 'var(--accent-gradient)', fontSize: '3rem' }}>
                  {getInitials(character.name)}
                </div>
            }
          </div>
          <div className="char-detail-info">
            <div className="char-detail-tags">
              {character.categories?.map(cat => (
                <span key={cat} className={`badge ${CATEGORY_COLORS[cat] || 'badge-purple'}`}>
                  {cat.replace('_', ' ')}
                </span>
              ))}
              <span className={`badge ${character.isPublic ? 'badge-teal' : 'badge-purple'}`}>
                {character.isPublic ? '🌍 Public' : '🔒 Private'}
              </span>
            </div>
            <h1 className="char-detail-name">{character.name}</h1>
            {character.tagline && <p className="char-detail-tagline">{character.tagline}</p>}

            <div className="char-detail-stats">
              <div className="char-stat">
                <span className="char-stat-num">{msgCount}</span>
                <span className="char-stat-label">Messages</span>
              </div>
              <div className="char-stat">
                <span className="char-stat-num">{memCount}</span>
                <span className="char-stat-label">Memories</span>
              </div>
              <div className="char-stat">
                <span className="char-stat-num">{formatDate(character.createdAt)}</span>
                <span className="char-stat-label">Created</span>
              </div>
            </div>

            <div className="char-detail-actions">
              <button
                id="chat-with-btn"
                className="btn btn-primary btn-lg"
                onClick={() => navigate(`/chat/${id}`)}
              >
                💬 Chat Now
              </button>
              <button
                id="edit-char-btn"
                className="btn btn-secondary"
                onClick={() => navigate(`/edit-character/${id}`)}
              >
                ✏️ Edit
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                🗑 Delete
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="char-detail-sections">
          {character.description && (
            <div className="glass-card char-detail-section animate-fade-in">
              <h3>📖 Background</h3>
              <p>{character.description}</p>
            </div>
          )}

          {character.personality && (
            <div className="glass-card char-detail-section animate-fade-in">
              <h3>✨ Personality</h3>
              <p>{character.personality}</p>
            </div>
          )}

          {character.greeting && (
            <div className="glass-card char-detail-section animate-fade-in">
              <h3>💬 Opening Line</h3>
              <blockquote className="char-greeting-quote">"{character.greeting}"</blockquote>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
