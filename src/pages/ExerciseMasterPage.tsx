import { useState, type FormEvent } from 'react'
import useExerciseMaster from '../hooks/useExerciseMaster'

export default function ExerciseMasterPage() {
  const { exercises, addExercise, removeExercise, error } = useExerciseMaster()
  const [name, setName] = useState('')

  function handleAdd() {
    if (!name.trim()) return
    addExercise(name.trim())
    setName('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    handleAdd()
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="h-[103px] bg-white border-b border-zinc-100 px-6 pt-[59px] pb-4 flex items-center">
        <h1 className="font-outfit font-extrabold text-[28px] tracking-[-1px]">種目マスター</h1>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-6 overflow-y-auto">
        {/* Add form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="flex-1 h-[52px] rounded-2xl bg-zinc-100 px-4 text-base font-inter"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="種目名を入力..."
          />
          <button
            type="submit"
            className="h-[52px] rounded-2xl bg-black text-white font-outfit font-bold text-base px-6 min-w-[44px]"
          >
            追加
          </button>
        </form>

        {error && (
          <p role="alert" className="text-red-500 font-inter text-sm px-1">
            {error}
          </p>
        )}

        {/* Exercise list */}
        <ul className="flex flex-col gap-2">
          {exercises.map((exercise) => (
            <li
              key={exercise.id}
              className="flex items-center justify-between h-[52px] rounded-2xl bg-zinc-100 px-4"
            >
              <span className="font-inter text-base">{exercise.name}</span>
              <button
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 font-outfit text-sm"
                onClick={() => removeExercise(exercise.id)}
                aria-label={`削除 ${exercise.name}`}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
