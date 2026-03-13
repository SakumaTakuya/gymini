const STORAGE_KEY = 'gymini:workouts'

function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll(workouts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
  } catch {
    // NFR-002: ignore write errors
  }
}

export function getById(id) {
  return getAll().find((w) => w.id === id)
}

export function listByDateDesc() {
  return getAll().sort((a, b) => b.date.localeCompare(a.date))
}

export function listByDate(date) {
  return getAll().filter((w) => w.date === date)
}

export function create(input) {
  const now = new Date().toISOString()
  const workout = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  const all = getAll()
  all.push(workout)
  saveAll(all)
  return workout
}

export function update(id, input) {
  const all = getAll()
  const index = all.findIndex((w) => w.id === id)
  if (index === -1) return null
  const existing = all[index]
  const updated = {
    ...existing,
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  }
  all[index] = updated
  saveAll(all)
  return updated
}

export function remove(id) {
  const all = getAll().filter((w) => w.id !== id)
  saveAll(all)
}
