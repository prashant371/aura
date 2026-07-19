import { create } from 'zustand'
import { PRESET_CHARACTERS } from '../lib/presets'

// ─── Helpers ─────────────────────────────────────────
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// Merge presets with user-created characters (presets always exist, deduped by id)
const mergePresets = (stored) => {
  const storedIds = new Set(stored.map(c => c.id))
  const missing = PRESET_CHARACTERS.filter(p => !storedIds.has(p.id))
  return [...missing, ...stored]
}

// ─── Store ───────────────────────────────────────────
const useStore = create((set, get) => ({

  // ── Settings ──
  settings: (() => {
    const defaults = {
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      defaultModel: 'gemini-2.0-flash',
      nsfwEnabled: false,
      voiceEnabled: true,
    }
    const saved = load('cv_settings', {})
    // Use env key as fallback only if user hasn't set their own key
    if (!saved.geminiApiKey && defaults.geminiApiKey) {
      saved.geminiApiKey = defaults.geminiApiKey
    }
    return { ...defaults, ...saved }
  })(),

  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch }
    set({ settings: next })
    save('cv_settings', next)
  },

  // ── User (mock auth) ──
  user: load('cv_user', null),
  setUser: (user) => {
    set({ user })
    save('cv_user', user)
  },
  logout: () => {
    set({ user: null })
    localStorage.removeItem('cv_user')
  },

  // ── Characters (presets + user-created) ──
  characters: mergePresets(load('cv_characters', [])),

  addCharacter: (char) => {
    const newChar = { ...char, id: generateId(), createdAt: Date.now(), is_preset: false }
    const next = [...get().characters, newChar]
    set({ characters: next })
    // Save only non-preset characters
    save('cv_characters', next.filter(c => !c.is_preset))
    return newChar
  },

  updateCharacter: (id, patch) => {
    const next = get().characters.map(c => c.id === id ? { ...c, ...patch } : c)
    set({ characters: next })
    save('cv_characters', next.filter(c => !c.is_preset))
  },

  deleteCharacter: (id) => {
    // Don't allow deleting presets
    if (id.startsWith('preset-')) return
    const next = get().characters.filter(c => c.id !== id)
    set({ characters: next })
    save('cv_characters', next.filter(c => !c.is_preset))
    // Cleanup chats & memories
    const chats = { ...get().chats }
    const memories = { ...get().memories }
    delete chats[id]
    delete memories[id]
    set({ chats, memories })
    save('cv_chats', chats)
    save('cv_memories', memories)
  },

  // ── Scenes ──
  scenes: load('cv_scenes', []),
  addScene: (scene) => {
    const next = [...get().scenes, { ...scene, id: generateId(), createdAt: Date.now() }]
    set({ scenes: next })
    save('cv_scenes', next)
  },
  updateScene: (id, patch) => {
    const next = get().scenes.map(s => s.id === id ? { ...s, ...patch } : s)
    set({ scenes: next })
    save('cv_scenes', next)
  },
  deleteScene: (id) => {
    const next = get().scenes.filter(s => s.id !== id)
    set({ scenes: next })
    save('cv_scenes', next)
  },

  // ── Personas ──
  personas: load('cv_personas', []),
  activePersonaId: load('cv_activePersona', null),
  addPersona: (persona) => {
    const next = [...get().personas, { ...persona, id: generateId(), createdAt: Date.now() }]
    set({ personas: next })
    save('cv_personas', next)
  },
  updatePersona: (id, patch) => {
    const next = get().personas.map(p => p.id === id ? { ...p, ...patch } : p)
    set({ personas: next })
    save('cv_personas', next)
  },
  deletePersona: (id) => {
    const next = get().personas.filter(p => p.id !== id)
    set({ personas: next })
    save('cv_personas', next)
    if (get().activePersonaId === id) {
      set({ activePersonaId: null })
      save('cv_activePersona', null)
    }
  },
  setActivePersona: (id) => {
    set({ activePersonaId: id })
    save('cv_activePersona', id)
  },

  // ── Individual Chats ── { [characterId]: [ {id, role, content, timestamp} ] }
  chats: load('cv_chats', {}),
  addMessage: (characterId, message) => {
    const prev = get().chats[characterId] || []
    const next = { ...get().chats, [characterId]: [...prev, { ...message, id: generateId(), timestamp: Date.now() }] }
    set({ chats: next })
    save('cv_chats', next)
  },
  updateLastMessage: (characterId, content) => {
    const msgs = [...(get().chats[characterId] || [])]
    if (msgs.length > 0) {
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
    }
    const next = { ...get().chats, [characterId]: msgs }
    set({ chats: next })
    save('cv_chats', next)
  },
  clearChat: (characterId) => {
    const next = { ...get().chats, [characterId]: [] }
    set({ chats: next })
    save('cv_chats', next)
  },
  deleteLastMessage: (characterId) => {
    const prev = get().chats[characterId] || []
    const next = { ...get().chats, [characterId]: prev.slice(0, -1) }
    set({ chats: next })
    save('cv_chats', next)
  },

  // ── Group Chats ── { [groupId]: { id, title, characterIds, messages: [] } }
  groupChats: load('cv_group_chats', {}),
  createGroupChat: (characterIds) => {
    const chars = get().characters.filter(c => characterIds.includes(c.id))
    const title = chars.map(c => c.name).join(' & ')
    const id = `group-${generateId()}`
    const groupChat = { id, title, characterIds, messages: [], createdAt: Date.now() }
    const next = { ...get().groupChats, [id]: groupChat }
    set({ groupChats: next })
    save('cv_group_chats', next)
    return id
  },
  addGroupMessage: (groupId, message) => {
    const group = get().groupChats[groupId]
    if (!group) return
    const msg = { ...message, id: generateId(), timestamp: Date.now() }
    const updated = { ...group, messages: [...group.messages, msg] }
    const next = { ...get().groupChats, [groupId]: updated }
    set({ groupChats: next })
    save('cv_group_chats', next)
  },
  updateLastGroupMessage: (groupId, content) => {
    const group = get().groupChats[groupId]
    if (!group) return
    const msgs = [...group.messages]
    if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
    const next = { ...get().groupChats, [groupId]: { ...group, messages: msgs } }
    set({ groupChats: next })
    save('cv_group_chats', next)
  },
  deleteLastGroupMessage: (groupId) => {
    const group = get().groupChats[groupId]
    if (!group) return
    const next = { ...get().groupChats, [groupId]: { ...group, messages: group.messages.slice(0, -1) } }
    set({ groupChats: next })
    save('cv_group_chats', next)
  },
  clearGroupChat: (groupId) => {
    const group = get().groupChats[groupId]
    if (!group) return
    const next = { ...get().groupChats, [groupId]: { ...group, messages: [] } }
    set({ groupChats: next })
    save('cv_group_chats', next)
  },

  // ── Memories ── { [characterId]: [ {id, content, timestamp} ] }
  memories: load('cv_memories', {}),
  addMemory: (characterId, content) => {
    const prev = get().memories[characterId] || []
    const mem = { id: generateId(), content, timestamp: Date.now() }
    const next = { ...get().memories, [characterId]: [...prev, mem] }
    set({ memories: next })
    save('cv_memories', next)
  },
  deleteMemory: (characterId, memoryId) => {
    const prev = get().memories[characterId] || []
    const next = { ...get().memories, [characterId]: prev.filter(m => m.id !== memoryId) }
    set({ memories: next })
    save('cv_memories', next)
  },
  clearMemories: (characterId) => {
    const next = { ...get().memories, [characterId]: [] }
    set({ memories: next })
    save('cv_memories', next)
  },
}))

export default useStore
export { generateId }
