import React from 'react'
import useWorkoutList from '../hooks/useWorkoutList'
import WorkoutCard from '../components/WorkoutCard'

export default function WorkoutListPage({ onStartNew, onEdit }) {
  const { workouts, deleteWorkout } = useWorkoutList()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* NavBar */}
      <div className="h-[103px] bg-white border-b border-zinc-100 px-6 pt-[59px] pb-4 flex items-center justify-between">
        <h1 className="font-outfit font-extrabold text-[28px] tracking-tight">ワークアウト</h1>
        <button
          className="h-[52px] rounded-2xl bg-black text-white font-outfit font-bold text-base px-6"
          onClick={onStartNew}
        >
          記録開始
        </button>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-3">
        {workouts.length === 0 ? (
          <p className="text-center font-inter text-zinc-500 mt-8">記録がありません</p>
        ) : (
          workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onDelete={deleteWorkout}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  )
}
