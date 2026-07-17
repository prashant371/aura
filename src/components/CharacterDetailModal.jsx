import { useNavigate } from 'react-router-dom'
import { CATEGORY_COLORS } from '../lib/presets'
import './CharacterDetailModal.css'

export default function CharacterDetailModal({ character, onClose, onChat, onGroupChat }) {
  const navigate = useNavigate()

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="char-detail-modal animate-slide-up"
        onClick={e => e.stopPropagation()}
        data-testid="character-detail-modal"
      >
        {/* Hero image */}
        <div className="char-detail-hero">
          <img
            src={character.avatar || character.avatar_url}
            alt={character.name}
          />
          <div className="char-detail-hero-overlay">
            <span className={`badge ${CATEGORY_COLORS[character.category] || 'badge-muted'}`}>
              {character.category}
            </span>
          </div>
          <button className="char-detail-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Content */}
        <div className="char-detail-content">
          <h2 className="char-detail-name">{character.name}</h2>
          <p className="char-detail-tagline">{character.tagline}</p>

          {character.tags && character.tags.length > 0 && (
            <div className="char-detail-tags">
              {character.tags.map(tag => (
                <span key={tag} className="badge badge-muted">{tag}</span>
              ))}
            </div>
          )}

          <div className="char-detail-section">
            <div className="overline" style={{ marginBottom: 8 }}>About</div>
            <p className="char-detail-desc">{character.description}</p>
          </div>

          <div className="char-detail-section">
            <div className="overline" style={{ marginBottom: 8 }}>Opening</div>
            <blockquote className="char-detail-greeting">
              {character.greeting}
            </blockquote>
          </div>

          <div className="char-detail-actions">
            <button
              data-testid="start-chat-btn"
              className="btn btn-primary"
              onClick={onChat}
            >
              Begin Scene
            </button>
            <button
              data-testid="add-to-group-btn"
              className="btn btn-secondary"
              onClick={onGroupChat}
            >
              + Group Scene
            </button>
            {!character.is_preset && (
              <button
                className="btn btn-ghost"
                onClick={() => navigate(`/edit-character/${character.id}`)}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
