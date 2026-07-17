import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { MOODS } from '../lib/helpers'
import './Scenes.css'

const INITIAL_SCENE = { name: '', description: '', mood: 'Neutral', backgroundUrl: '' }

export default function Scenes() {
  const navigate = useNavigate()
  const scenes = useStore(s => s.scenes)
  const addScene = useStore(s => s.addScene)
  const deleteScene = useStore(s => s.deleteScene)
  const updateScene = useStore(s => s.updateScene)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(INITIAL_SCENE)

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editingId) {
      updateScene(editingId, form)
      setEditingId(null)
    } else {
      addScene(form)
    }
    setForm(INITIAL_SCENE)
    setShowForm(false)
  }

  const startEdit = (scene) => {
    setForm({ name: scene.name, description: scene.description, mood: scene.mood || 'Neutral', backgroundUrl: scene.backgroundUrl || '' })
    setEditingId(scene.id)
    setShowForm(true)
  }

  const MOOD_EMOJIS = {
    Neutral: '☁️', Dark: '🌑', Romantic: '🌹', Adventurous: '⚔️',
    Mysterious: '🌫️', Comedic: '🎭', Dramatic: '🎬', Horror: '🕯️',
    Fantasy: '🌟', 'Post-Apocalyptic': '💀'
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="scenes-header animate-fade-in">
          <div>
            <h1>🌍 Scenes</h1>
            <p>Create immersive worlds and settings for your character conversations.</p>
          </div>
          <button
            id="add-scene-btn"
            className="btn btn-primary"
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(INITIAL_SCENE) }}
          >
            + New Scene
          </button>
        </div>

        {/* Scene Form */}
        {showForm && (
          <div className="glass-card scene-form-card animate-scale-in">
            <h3>{editingId ? 'Edit Scene' : 'Create New Scene'}</h3>
            <form onSubmit={handleSubmit} className="scene-form">
              <div className="form-group">
                <label className="form-label">Scene Name *</label>
                <input
                  id="scene-name"
                  type="text"
                  className="input"
                  placeholder="e.g. Enchanted Forest, Space Station Omega"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  id="scene-description"
                  className="textarea"
                  placeholder="Describe the setting, atmosphere, and details of this scene..."
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mood / Tone</label>
                <div className="mood-grid">
                  {MOODS.map(mood => (
                    <button
                      key={mood}
                      type="button"
                      className={`mood-btn ${form.mood === mood ? 'selected' : ''}`}
                      onClick={() => update('mood', mood)}
                    >
                      {MOOD_EMOJIS[mood]} {mood}
                    </button>
                  ))}
                </div>
              </div>
              <div className="scene-form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>
                  Cancel
                </button>
                <button id="save-scene-btn" type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : '+ Create Scene'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scenes Grid */}
        {scenes.length === 0 && !showForm ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-icon">🌍</div>
            <h3>No scenes yet</h3>
            <p>Create a scene to set the mood and backdrop for your character chats.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create Scene</button>
          </div>
        ) : (
          <div className="scenes-grid">
            {scenes.map(scene => (
              <div key={scene.id} id={`scene-${scene.id}`} className="glass-card glow scene-card animate-fade-in">
                <div className="scene-card-top">
                  <span className="scene-mood-icon">{MOOD_EMOJIS[scene.mood] || '🌍'}</span>
                  <span className={`badge ${scene.mood === 'Dark' || scene.mood === 'Horror' ? 'badge-purple' : scene.mood === 'Romantic' ? 'badge-pink' : 'badge-teal'}`}>
                    {scene.mood || 'Neutral'}
                  </span>
                </div>
                <h3 className="scene-card-name">{scene.name}</h3>
                {scene.description && <p className="scene-card-desc">{scene.description}</p>}
                <div className="scene-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(scene)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteScene(scene.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
