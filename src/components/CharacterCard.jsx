import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { useMessageCount } from '../lib/hooks'
import { getInitials, truncate, formatTime, CATEGORY_COLORS } from '../lib/helpers'
import './CharacterCard.css'

export default function CharacterCard({ character }) {
  const navigate = useNavigate()
  const msgCount = useMessageCount(character.id)

  return (
    <div
      className="character-card glass-card glow animate-fade-in"
      id={`character-card-${character.id}`}
      onClick={() => navigate(`/character/${character.id}`)}
    >
      {/* Avatar / Cover */}
      <div className="character-card-top">
        <div className="character-card-avatar-wrap">
          {character.avatar
            ? <img src={character.avatar} alt={character.name} className="character-card-avatar" />
            : <div className="avatar-placeholder character-card-avatar" style={{ fontSize: '2rem' }}>
                {getInitials(character.name)}
              </div>
          }
        </div>

        {/* Tags */}
        <div className="character-card-tags">
          {character.categories?.slice(0, 2).map(cat => (
            <span key={cat} className={`badge ${CATEGORY_COLORS[cat] || 'badge-purple'}`}>
              {cat.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="character-card-body">
        <h3 className="character-card-name">{character.name}</h3>
        {character.tagline && (
          <p className="character-card-tagline">{truncate(character.tagline, 80)}</p>
        )}
        <div className="character-card-meta">
          <span className="character-card-msgs">
            💬 {msgCount} {msgCount === 1 ? 'message' : 'messages'}
          </span>
          {character.createdAt && (
            <span className="character-card-time">{formatTime(character.createdAt)}</span>
          )}
        </div>
      </div>

      {/* Chat button */}
      <div className="character-card-footer">
        <button
          id={`chat-btn-${character.id}`}
          className="btn btn-primary btn-sm character-card-chat-btn"
          onClick={(e) => { e.stopPropagation(); navigate(`/chat/${character.id}`) }}
        >
          Chat Now →
        </button>
      </div>
    </div>
  )
}
