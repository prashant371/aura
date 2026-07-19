import useStore from '../store/useStore'

const EMPTY_ARRAY = []

export function useCharacter(id) {
  const characters = useStore(s => s.characters)
  return characters.find(c => c.id === id)
}

export function useMessages(id) {
  const chats = useStore(s => s.chats)
  return chats[id] || EMPTY_ARRAY
}

export function useMemories(id) {
  const memories = useStore(s => s.memories)
  return memories[id] || EMPTY_ARRAY
}

export function useActivePersona() {
  const personas = useStore(s => s.personas)
  const activePersonaId = useStore(s => s.activePersonaId)
  return personas.find(p => p.id === activePersonaId) || null
}

export function useGroupChat(id) {
  const groupChats = useStore(s => s.groupChats)
  return groupChats[id]
}
