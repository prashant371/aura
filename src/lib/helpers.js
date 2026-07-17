// Utility helpers for Aura

export const CATEGORY_COLORS = {
  'Sci-Fi':     'badge-terra',
  'Fantasy':    'badge-gold',
  'Historical': 'badge-gold',
  'Anime':      'badge-terra',
  'Therapist':  'badge-muted',
  'Adventure':  'badge-muted',
  'Custom':     'badge-muted',
  'All':        'badge-muted',
}

export const CATEGORIES = ['All', 'Sci-Fi', 'Fantasy', 'Historical', 'Anime', 'Therapist', 'Adventure', 'Custom']
export const MOODS = ['Neutral', 'Dark', 'Romantic', 'Adventurous', 'Mysterious', 'Comedic', 'Dramatic', 'Horror', 'Fantasy', 'Post-Apocalyptic']

export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffMins = Math.floor((now - d) / 60000)
  const diffHours = Math.floor((now - d) / 3600000)
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export function truncate(str, max = 120) {
  if (!str || str.length <= max) return str
  return str.slice(0, max).trimEnd() + '…'
}

export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
