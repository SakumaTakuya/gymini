import React, { useState } from 'react'
import './index.css'
import WorkoutListPage from './pages/WorkoutListPage'
import WorkoutFormPage from './pages/WorkoutFormPage'

export default function App() {
  const [page, setPage] = useState('list') // 'list' | 'form'
  const [editWorkout, setEditWorkout] = useState(null)

  function handleStartNew() {
    setEditWorkout(null)
    setPage('form')
  }

  function handleEdit(workout) {
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
