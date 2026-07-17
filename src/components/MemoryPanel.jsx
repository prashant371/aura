import useStore from '../store/useStore'
import { useMemories } from '../lib/hooks'
import { formatDate } from '../lib/helpers'
import './MemoryPanel.css'

export default function MemoryPanel({ characterId }) {
  const memories = useMemories(characterId)
  const deleteMemory = useStore(s => s.deleteMemory)
  const clearMemories = useStore(s => s.clearMemories)

  return (
    <div className="memory-panel" id="memory-panel">
      <div className="memory-panel-header">
        <div className="memory-panel-title">
          <span>🧠</span>
          <span>Memories</span>
          <span className="memory-count">{memories.length}</span>
        </div>
        {memories.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => clearMemories(characterId)}
            id="clear-memories-btn"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="memory-panel-body">
        {memories.length === 0 ? (
          <div className="memory-empty">
            <span>💭</span>
            <p>No memories yet. Start chatting and the character will remember important things about you!</p>
          </div>
        ) : (
          <div className="memory-list">
            {memories.map(mem => (
              <div key={mem.id} className="memory-item animate-fade-in">
                <div className="memory-item-content">
                  <span className="memory-dot">●</span>
                  <span>{mem.content}</span>
                </div>
                <div className="memory-item-footer">
                  <span className="memory-item-date">{formatDate(mem.timestamp)}</span>
                  <button
                    className="memory-delete"
                    onClick={() => deleteMemory(characterId, mem.id)}
                    aria-label="Delete memory"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
