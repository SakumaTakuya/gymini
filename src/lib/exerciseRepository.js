const STORAGE_KEY = 'gymini:exercises'

function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function search(query) {
  const all = getAll()
  if (!query) return all
  const lower = query.toLowerCase()
  return all.filter((e) => e.name.toLowerCase().includes(lower))
}
