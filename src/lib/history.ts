'use client'

const HISTORY_KEY = 'biblio_search_history'
const MAX_HISTORY = 8

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToHistory(term: string) {
  if (!term.trim()) return
  const history = getSearchHistory()
  const newHistory = [term, ...history.filter((h) => h !== term)].slice(
    0,
    MAX_HISTORY
  )
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
  window.dispatchEvent(new Event('history-updated'))
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
  window.dispatchEvent(new Event('history-updated'))
}
