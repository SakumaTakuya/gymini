import { useState } from 'react'
import './index.css'
import type { WorkoutRecord } from './types'
import WorkoutListPage from './pages/WorkoutListPage'
import WorkoutFormPage from './pages/WorkoutFormPage'

type Page = 'list' | 'form'

export default function App() {
  const [page, setPage] = useState<Page>('list')
  const [editWorkout, setEditWorkout] = useState<WorkoutRecord | null>(null)

  function handleStartNew() {
    setEditWorkout(null)
    setPage('form')
  }

  function handleEdit(workout: WorkoutRecord) {
    setEditWorkout(workout)
    setPage('form')
  }

  function handleSave() {
    setPage('list')
    setEditWorkout(null)
  }

  function handleCancel() {
    setPage('list')
    setEditWorkout(null)
  }

  if (page === 'form') {
    return (
      <WorkoutFormPage
        onSave={handleSave}
        onCancel={handleCancel}
        editWorkout={editWorkout}
      />
    )
  }

  return (
    <WorkoutListPage onStartNew={handleStartNew} onEdit={handleEdit} />
  )
}
