// ─── Gemini API Client ────────────────────────────────────────
// Streaming chat + memory extraction for Aura AI Chat

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

/**
 * Build system prompt combining character, scene, persona, memories.
 * Supports NSFW mode and group chat context.
 */
export function buildSystemPrompt({ character, scene, persona, memories = [], nsfwEnabled = false, groupContext = null }) {
  const parts = []

  parts.push(`You are ${character.name}.`)
  if (character.tagline) parts.push(character.tagline)
  if (character.description) parts.push(`\nBackground:\n${character.description}`)
  if (character.personality) parts.push(`\nPersonality & Speech:\n${character.personality}`)

  if (persona) {
    parts.push(`\nThe person you are talking to is ${persona.name}.`)
    if (persona.description) parts.push(persona.description)
  }

  if (scene) {
    parts.push(`\nCurrent Setting: ${scene.name} — ${scene.description}`)
    if (scene.mood) parts.push(`Mood/Tone: ${scene.mood}`)
  }

  if (groupContext) {
    parts.push(`\nGroup Context: ${groupContext}`)
  }

  if (memories.length > 0) {
    parts.push(`\nMemories about this person:\n${memories.map(m => `- ${m.content}`).join('\n')}`)
  }

  parts.push(`
Roleplay Instructions:
- Stay completely in character as ${character.name} at all times.
- Never break character or reveal you are an AI.
- Write naturally with the character's personality, emotions, and speech patterns.
- For action/narration, use *asterisks* (e.g., *leans against the wall*).
- Keep responses immersive and appropriately detailed — not too short, not too long.
- Leave conversational space for the user to respond; don't monologue excessively.
${nsfwEnabled ? '- Mature and adult themes may be explored freely, within the character\'s authentic nature.' : '- Handle dark or mature themes thoughtfully and tastefully.'}
`)

  return parts.join('\n')
}

/**
 * Stream chat with Gemini API.
 * Calls onChunk with accumulated text, returns final text.
 */
export async function streamChat({
  apiKey,
  model = 'gemini-2.0-flash',
  systemPrompt,
  history,
  userMessage,
  onChunk,
  nsfwEnabled = false,
  retries = 2,
}) {
  const url = `${BASE_URL}/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

  const contents = [
    ...history.map(msg => {
      const text = typeof msg.content === 'string' ? msg.content : msg.content
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text }]
      }
    }),
    { role: 'user', parts: [{ text: userMessage }] }
  ]

  // Safety settings based on NSFW toggle
  const safetySettings = nsfwEnabled
    ? [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    : [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ]

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.92,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${response.status}`

    // Auto-fallback for unsupported models
    if ((response.status === 404 || response.status === 400 || msg.includes('not found')) && retries > 0) {
      console.warn(`Model ${model} failed, falling back to gemini-flash-latest…`)
      return streamChat({ apiKey, model: 'gemini-flash-latest', systemPrompt, history, userMessage, onChunk, nsfwEnabled, retries: retries - 1 })
    }

    // Rate limit (429) fast retry with gemini-flash-latest or clear error
    if (response.status === 429) {
      if (retries > 0) {
        console.warn('Rate limit hit (429), retrying with gemini-flash-latest…')
        await new Promise(r => setTimeout(r, 1200))
        return streamChat({ apiKey, model: 'gemini-flash-latest', systemPrompt, history, userMessage, onChunk, nsfwEnabled, retries: retries - 1 })
      }
      throw new Error('Gemini rate limit reached (429). Please wait a few seconds before sending another message, or check your API key in Settings.')
    }

    if (response.status === 400 && msg.includes('API key')) {
      throw new Error('Invalid Gemini API Key. Please update your key in Settings.')
    }

    throw new Error(`${msg} (Model: ${model})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')
    let chunkUpdated = false

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          fullText += text
          chunkUpdated = true
        }
      } catch { /* ignore parse errors */ }
    }
    
    if (chunkUpdated) {
      onChunk?.(fullText)
    }
  }

  return fullText
}

/**
 * Extract memory-worthy facts from a conversation turn.
 */
export async function extractMemories({ apiKey, model = 'gemini-2.0-flash', userMessage, assistantResponse, existingMemories = [] }) {
  const url = `${BASE_URL}/models/${model}:generateContent?key=${apiKey}`
  const existingList = existingMemories.map(m => `- ${m.content}`).join('\n') || 'None'

  const prompt = `Analyze this conversation excerpt and extract any important facts about the USER (not the AI character) worth remembering.

User: "${userMessage}"
AI: "${assistantResponse}"

Existing memories: ${existingList}

Return ONLY a JSON array of NEW facts (short sentences). If nothing worth remembering, return [].
Example: ["User's name is Alex", "User loves fantasy novels"]
Return only valid JSON, no markdown.`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
      })
    })
    if (!res.ok) return []
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]'
    const facts = JSON.parse(text)
    return Array.isArray(facts) ? facts : []
  } catch {
    return []
  }
}
