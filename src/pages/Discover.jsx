import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { CATEGORIES, CATEGORY_COLORS } from '../lib/presets'
import CharacterDetailModal from '../components/CharacterDetailModal'
import './Discover.css'

export default function Discover() {
  const navigate = useNavigate()
  const characters = useStore(s => s.characters)
  const groupChats = useStore(s => s.groupChats)
  const createGroupChat = useStore(s => s.createGroupChat)

  const [filterCategory, setFilterCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedChar, setSelectedChar] = useState(null)
  const [groupSelectMode, setGroupSelectMode] = useState(false)
  const [groupSelected, setGroupSelected] = useState([])

  const filtered = useMemo(() => {
    let list = [...characters]
    if (filterCategory !== 'All') {
      list = list.filter(c => c.category === filterCategory)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.tagline?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [characters, filterCategory, search])

  const toggleGroupSelect = useCallback((id) => {
    setGroupSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }, [])

  const startGroupChat = () => {
    if (groupSelected.length < 2) return
    const groupId = createGroupChat(groupSelected)
    navigate(`/group/${groupId}`)
  }

  // Split for bento: first card is featured (large), rest normal
  const [featured, ...rest] = filtered
  const myCharacters = characters.filter(c => !c.is_preset)

  return (
    <div className="page-wrapper discover-page">
      <div className="container">

        {/* Header */}
        <div className="discover-header animate-fade-up">
          <div>
            <div className="overline">Discover</div>
            <h1 className="discover-title">Your Stage Awaits</h1>
          </div>
          <div className="discover-header-actions">
            {groupSelectMode ? (
              <>
                <span className="discover-group-count">
                  {groupSelected.length} selected
                </span>
                <button
                  className="btn btn-primary"
                  onClick={startGroupChat}
                  disabled={groupSelected.length < 2}
                  data-testid="start-group-chat-btn"
                >
                  Start Group Chat
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setGroupSelectMode(false); setGroupSelected([]) }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => setGroupSelectMode(true)}
                  data-testid="group-mode-btn"
                >
                  + Group Chat
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/create-character')}
                  data-testid="create-char-btn"
                >
                  Create Character
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="discover-filters animate-fade-up">
          <input
            data-testid="discover-search"
            type="text"
            className="input input-boxed discover-search"
            placeholder="Search characters…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="discover-pills">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-pill ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
                data-testid={`filter-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-icon">✦</div>
            <h3>No characters found</h3>
            <p>Try a different search or filter</p>
          </div>
        ) : (
          <div className="bento-grid">
            {/* Featured card — large */}
            {featured && (
              <div
                className={`bento-card bento-featured ${groupSelectMode && groupSelected.includes(featured.id) ? 'selected' : ''}`}
                onClick={() => groupSelectMode ? toggleGroupSelect(featured.id) : setSelectedChar(featured)}
                data-testid={`character-card-${featured.id}`}
              >
                <img src={featured.avatar || featured.avatar_url} alt={featured.name} className="bento-img" />
                <div className="bento-overlay">
                  {groupSelectMode && (
                    <div className="bento-check">{groupSelected.includes(featured.id) ? '✓' : ''}</div>
                  )}
                  <span className={`badge ${CATEGORY_COLORS[featured.category] || 'badge-muted'}`}>
                    {featured.category}
                  </span>
                  <h3 className="bento-name">{featured.name}</h3>
                  <p className="bento-tagline">{featured.tagline}</p>
                </div>
              </div>
            )}

            {/* Rest of cards */}
            {rest.map((char) => (
              <div
                key={char.id}
                className={`bento-card ${groupSelectMode && groupSelected.includes(char.id) ? 'selected' : ''}`}
                onClick={() => groupSelectMode ? toggleGroupSelect(char.id) : setSelectedChar(char)}
                data-testid={`character-card-${char.id}`}
              >
                <img src={char.avatar || char.avatar_url} alt={char.name} className="bento-img" />
                <div className="bento-overlay">
                  {groupSelectMode && (
                    <div className="bento-check">{groupSelected.includes(char.id) ? '✓' : ''}</div>
                  )}
                  <span className={`badge ${CATEGORY_COLORS[char.category] || 'badge-muted'}`}>
                    {char.category}
                  </span>
                  <h4 className="bento-name">{char.name}</h4>
                  <p className="bento-tagline">{char.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Characters section */}
        {myCharacters.length > 0 && filterCategory === 'All' && !search && (
          <div className="my-characters">
            <div className="divider" />
            <div className="overline" style={{ marginBottom: 16 }}>My Characters</div>
            <div className="my-chars-grid">
              {myCharacters.map(char => (
                <div
                  key={char.id}
                  className="my-char-card"
                  onClick={() => setSelectedChar(char)}
                  data-testid={`my-character-${char.id}`}
                >
                  {char.avatar || char.avatar_url ? (
                    <img src={char.avatar || char.avatar_url} alt={char.name} className="avatar avatar-md" />
                  ) : (
                    <div className="avatar-placeholder avatar-md">{char.name[0]}</div>
                  )}
                  <div className="my-char-info">
                    <div className="my-char-name">{char.name}</div>
                    <div className="my-char-sub">{char.tagline}</div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={e => { e.stopPropagation(); navigate(`/edit-character/${char.id}`) }}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Character Detail Modal */}
      {selectedChar && (
        <CharacterDetailModal
          character={selectedChar}
          onClose={() => setSelectedChar(null)}
          onChat={() => {
            navigate(`/chat/${selectedChar.id}`)
          }}
          onGroupChat={() => {
            setGroupSelectMode(true)
            setGroupSelected([selectedChar.id])
            setSelectedChar(null)
          }}
        />
      )}
    </div>
  )
}
