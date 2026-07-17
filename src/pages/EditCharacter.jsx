import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useStore from '../store/useStore'
import { CATEGORIES, VOICES } from '../lib/presets'
import './CreateCharacter.css'

export default function EditCharacter() {
  const { id } = useParams()
  const navigate = useNavigate()
  const character = useStore(s => s.characters.find(c => c.id === id))
  const updateCharacter = useStore(s => s.updateCharacter)
  const deleteCharacter = useStore(s => s.deleteCharacter)

  const [form, setForm] = useState({ name: '', tagline: '', description: '', personality: '', greeting: '', category: 'Custom', tags: [], voice: 'alloy', avatar_url: '' })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    if (character) {
      setForm({
        name: character.name || '',
        tagline: character.tagline || '',
        description: character.description || '',
        personality: character.personality || '',
        greeting: character.greeting || '',
        category: character.category || 'Custom',
        tags: character.tags || [],
        voice: character.voice || 'alloy',
        avatar_url: character.avatar_url || '',
      })
      setAvatarPreview(character.avatar || character.avatar_url || '')
    }
  }, [id])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.tagline.trim()) e.tagline = 'Tagline is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.personality.trim()) e.personality = 'Personality is required'
    if (!form.greeting.trim()) e.greeting = 'Opening line is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    updateCharacter(id, { ...form, avatar: avatarPreview })
    navigate('/discover')
  }

  const handleDelete = () => {
    if (window.confirm(`Delete ${character?.name}? This cannot be undone.`)) {
      deleteCharacter(id)
      navigate('/discover')
    }
  }

  const handleAvatarFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  if (!character) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <h3>Character not found</h3>
            <button className="btn btn-primary" onClick={() => navigate('/discover')}>Back</button>
          </div>
        </div>
      </div>
    )
  }

  if (character.is_preset) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <h3>Cannot edit preset characters</h3>
            <button className="btn btn-primary" onClick={() => navigate('/discover')}>Back</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="container create-container">
        <div className="create-header animate-fade-up">
          <div className="overline">Edit Character</div>
          <h1>{character.name}</h1>
        </div>

        <form onSubmit={handleSubmit} className="create-form animate-fade-up" noValidate>

          <div className="create-avatar-section">
            <div className="create-avatar-preview" onClick={() => fileRef.current.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <div className="create-avatar-placeholder"><span>+</span><span>Upload</span></div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
            <div className="create-avatar-or">or</div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Avatar URL</label>
              <input className="input" type="url" placeholder="https://…" value={form.avatar_url}
                onChange={e => { set('avatar_url', e.target.value); setAvatarPreview(e.target.value) }} />
            </div>
          </div>

          <div className="create-grid-2">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="select" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px' }}
                value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tagline *</label>
            <input className={`input ${errors.tagline ? 'error' : ''}`} value={form.tagline} onChange={e => set('tagline', e.target.value)} />
            {errors.tagline && <span className="form-error">{errors.tagline}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className={`textarea ${errors.description ? 'error' : ''}`}
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}
              value={form.description} onChange={e => set('description', e.target.value)} rows={4} />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Personality *</label>
            <textarea className={`textarea ${errors.personality ? 'error' : ''}`}
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}
              value={form.personality} onChange={e => set('personality', e.target.value)} rows={3} />
            {errors.personality && <span className="form-error">{errors.personality}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Opening Message *</label>
            <textarea className={`textarea ${errors.greeting ? 'error' : ''}`}
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}
              value={form.greeting} onChange={e => set('greeting', e.target.value)} rows={4} />
            {errors.greeting && <span className="form-error">{errors.greeting}</span>}
          </div>

          <div className="create-grid-2">
            <div className="form-group">
              <label className="form-label">Voice Style</label>
              <select className="select" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px' }}
                value={form.voice} onChange={e => set('voice', e.target.value)}>
                {VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="tag-input-row">
                <input className="input input-boxed" placeholder="Add tag…" value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const t = tagInput.trim().toLowerCase(); if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]); setTagInput('') } }} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { const t = tagInput.trim().toLowerCase(); if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]); setTagInput('') }}>+</button>
              </div>
              {form.tags.length > 0 && (
                <div className="tag-chips">
                  {form.tags.map(t => (
                    <span key={t} className="tag-chip">{t}
                      <button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="create-actions" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>Delete Character</button>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
