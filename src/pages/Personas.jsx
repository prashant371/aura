import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import AvatarUpload from '../components/AvatarUpload'
import { getInitials } from '../lib/helpers'
import './Personas.css'

const INITIAL = { name: '', description: '', avatar: null }

export default function Personas() {
  const navigate = useNavigate()
  const personas = useStore(s => s.personas)
  const activePersonaId = useStore(s => s.activePersonaId)
  const addPersona = useStore(s => s.addPersona)
  const updatePersona = useStore(s => s.updatePersona)
  const deletePersona = useStore(s => s.deletePersona)
  const setActivePersona = useStore(s => s.setActivePersona)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(INITIAL)

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editingId) {
      updatePersona(editingId, form)
      setEditingId(null)
    } else {
      addPersona(form)
    }
    setForm(INITIAL)
    setShowForm(false)
  }

  const startEdit = (persona) => {
    setForm({ name: persona.name, description: persona.description || '', avatar: persona.avatar || null })
    setEditingId(persona.id)
    setShowForm(true)
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="personas-header animate-fade-in">
          <div>
            <h1>👤 Personas</h1>
            <p>Create alternate identities for yourself to use when chatting with characters.</p>
          </div>
          <button
            id="add-persona-btn"
            className="btn btn-primary"
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(INITIAL) }}
          >
            + New Persona
          </button>
        </div>

        {/* Persona Form */}
        {showForm && (
          <div className="glass-card persona-form-card animate-scale-in">
            <h3>{editingId ? 'Edit Persona' : 'Create New Persona'}</h3>
            <form onSubmit={handleSubmit} className="persona-form">
              <div className="persona-form-avatar">
                <AvatarUpload value={form.avatar} onChange={v => update('avatar', v)} name={form.name} />
              </div>
              <div className="persona-form-fields">
                <div className="form-group">
                  <label className="form-label">Persona Name *</label>
                  <input
                    id="persona-name"
                    type="text"
                    className="input"
                    placeholder="Your name in this persona"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    id="persona-description"
                    className="textarea"
                    placeholder="How would you describe this persona? (background, personality, who you are in this role)"
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="persona-form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>
                    Cancel
                  </button>
                  <button id="save-persona-btn" type="submit" className="btn btn-primary">
                    {editingId ? 'Save Changes' : 'Create Persona'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Personas List */}
        {personas.length === 0 && !showForm ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-icon">👤</div>
            <h3>No personas yet</h3>
            <p>Create a persona to present yourself differently in each conversation.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create Persona</button>
          </div>
        ) : (
          <div className="personas-list">
            {personas.map(persona => {
              const isActive = persona.id === activePersonaId
              return (
                <div
                  key={persona.id}
                  id={`persona-${persona.id}`}
                  className={`glass-card glow persona-card animate-fade-in ${isActive ? 'persona-active' : ''}`}
                >
                  <div className="persona-card-left">
                    {persona.avatar
                      ? <img src={persona.avatar} alt={persona.name} className="avatar avatar-lg" />
                      : <div className="avatar-placeholder avatar-lg" style={{ background: 'var(--accent-gradient)', fontSize: '1.5rem' }}>
                          {getInitials(persona.name)}
                        </div>
                    }
                  </div>
                  <div className="persona-card-info">
                    <div className="persona-card-top">
                      <h3>{persona.name}</h3>
                      {isActive && <span className="badge badge-purple">✦ Active</span>}
                    </div>
                    {persona.description && <p className="persona-desc">{persona.description}</p>}
                  </div>
                  <div className="persona-card-actions">
                    {!isActive && (
                      <button
                        id={`set-active-${persona.id}`}
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActivePersona(persona.id)}
                      >
                        Set Active
                      </button>
                    )}
                    {isActive && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setActivePersona(null)}
                      >
                        Deactivate
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(persona)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deletePersona(persona.id)}>Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
