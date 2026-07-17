import useStore from '../store/useStore'

export function useCharacter(id) {
  return useStore(s => s.characters.find(c => c.id === id))
}

export function useMessages(id) {
  return useStore(s => s.chats[id] || [])
}

export function useMemories(id) {
  return useStore(s => s.memories[id] || [])
}

export function useActivePersona() {
  const personas = useStore(s => s.personas)
  const activePersonaId = useStore(s => s.activePersonaId)
  return personas.find(p => p.id === activePersonaId) || null
}

export function useGroupChat(id) {
  return useStore(s => s.groupChats[id])
}
