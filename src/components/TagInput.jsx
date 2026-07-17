import { useState, useRef } from 'react'
import './TagInput.css'

export default function TagInput({ value = [], onChange, placeholder = 'Add tag...', options = [] }) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef()

  const addTag = (tag) => {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInput('')
    setShowSuggestions(false)
  }

  const removeTag = (tag) => {
    onChange(value.filter(t => t !== tag))
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const suggestions = options.filter(o =>
    !value.includes(o) && o.toLowerCase().includes(input.toLowerCase())
  )

  return (
    <div className="tag-input-wrap" id="tag-input">
      <div className="tag-input-field" onClick={() => inputRef.current?.focus()}>
        {value.map(tag => (
          <span key={tag} className="tag-chip">
            {tag.replace('_', ' ')}
            <button type="button" onClick={() => removeTag(tag)} className="tag-remove">×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true) }}
          onKeyDown={handleKey}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="tag-input-inner"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="tag-suggestions animate-fade-in">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              className="tag-suggestion-item"
              onMouseDown={() => addTag(s)}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
