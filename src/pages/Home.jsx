import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import CharacterCard from '../components/CharacterCard'
import { CATEGORIES } from '../lib/helpers'
import './Home.css'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Created' },
  { value: 'chats', label: 'Most Chatted' },
  { value: 'name', label: 'Name A–Z' },
]

export default function Home() {
  const navigate = useNavigate()
  const characters = useStore(s => s.characters)
  const chats = useStore(s => s.chats)
  const settings = useStore(s => s.settings)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [sort, setSort] = useState('recent')

  const filtered = useMemo(() => {
    let list = [...characters]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.tagline?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    }

    if (filterCategory !== 'All') {
      list = list.filter(c => c.categories?.includes(filterCategory))
    }

    if (sort === 'recent') list.sort((a, b) => b.createdAt - a.createdAt)
    else if (sort === 'chats') list.sort((a, b) => (chats[b.id]?.length || 0) - (chats[a.id]?.length || 0))
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))

    return list
  }, [characters, chats, search, filterCategory, sort])

  const hasApiKey = !!settings.geminiApiKey

  return (
    <div className="page-wrapper">
      <div className="container">

        {/* Hero */}
        <section className="home-hero animate-fade-in">
          <div className="home-hero-badge badge badge-purple">✦ Powered by Gemini AI</div>
          <h1 className="home-hero-title">
            Create & Chat with<br />
            <span className="gradient-text">AI Characters</span>
          </h1>
          <p className="home-hero-sub">
            Build your own characters, set scenes, define personas — then have immersive AI conversations with unlimited memory.
          </p>
          <div className="home-hero-actions">
            <button
              id="hero-create-btn"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/create-character')}
            >
              ✦ Create Character
            </button>
            {!hasApiKey && (
              <button
                id="hero-settings-btn"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/settings')}
              >
                ⚙ Setup API Key
              </button>
            )}
          </div>
        </section>

        {/* API Key Warning */}
        {!hasApiKey && (
          <div className="api-warning animate-fade-in">
            <span>⚠️</span>
            <p>Add your <strong>Gemini API key</strong> in Settings to enable AI chat. It's free at <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer">aistudio.google.com</a>.</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/settings')}>Add Key →</button>
          </div>
        )}

        {/* Stats bar */}
        {characters.length > 0 && (
          <div className="home-stats animate-fade-in">
            <div className="home-stat">
              <span className="home-stat-num">{characters.length}</span>
              <span className="home-stat-label">Characters</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <span className="home-stat-num">
                {Object.values(chats).reduce((a, m) => a + m.length, 0)}
              </span>
              <span className="home-stat-label">Messages</span>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        {characters.length > 0 && (
          <div className="home-filter-bar animate-fade-in">
            <input
              id="search-input"
              type="text"
              className="input home-search"
              placeholder="🔍  Search characters..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="home-filter-pills">
              <button
                className={`filter-pill ${filterCategory === 'All' ? 'active' : ''}`}
                onClick={() => setFilterCategory('All')}
              >All</button>
              {CATEGORIES.slice(0, 6).map(cat => (
                <button
                  key={cat}
                  className={`filter-pill ${filterCategory === cat ? 'active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
            <select
              id="sort-select"
              className="select home-sort"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Characters Grid */}
        {characters.length === 0 ? (
          <div className="empty-state home-empty animate-fade-in">
            <div className="empty-icon">🎭</div>
            <h3>No characters yet</h3>
            <p>Create your first AI character and start an immersive conversation!</p>
            <button className="btn btn-primary" onClick={() => navigate('/create-character')}>
              ✦ Create First Character
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-icon">🔍</div>
            <h3>No characters match</h3>
            <p>Try a different search or filter.</p>
          </div>
        ) : (
          <div className="characters-grid">
            {filtered.map(char => (
              <CharacterCard key={char.id} character={char} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
