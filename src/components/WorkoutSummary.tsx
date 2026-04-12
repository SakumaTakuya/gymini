import { Card } from '@/components/ui/card'
import { formatDateHeader } from '../lib/dateFormat'
import type { DateString } from '../schemas/date'
import type { Workout } from '../schemas/workout'

interface WorkoutSummaryProps {
  date: DateString
  workouts: Workout[]
}

export function WorkoutSummary({ date, workouts }: WorkoutSummaryProps) {
  return (
    <>
      <div className="px-6 mb-3">
        <h3 className="font-jp font-bold text-sm text-gym-zinc-500">
          {formatDateHeader(date)}
        </h3>
      </div>

      {workouts.map((workout) => (
        <Card
          key={workout.id}
          className="mx-4 mb-6 rounded-[24px] p-5 shadow-soft border border-gym-zinc-100 ring-0"
        >
          <div className="flex flex-col gap-4">
            {workout.exercises.map((exercise, ei) => (
              <div key={`${workout.id}-${exercise.exerciseId}-${ei}`}>
                {ei > 0 && <div className="h-px w-full bg-gym-zinc-100 mb-4" />}
                <p className="font-outfit font-bold text-base text-gym-black mb-2">
                  {exercise.exerciseName}
                </p>
                <div className="space-y-1">
                  {exercise.sets.map((set, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gym-zinc-400 w-8">
                        SET{si + 1}
                      </span>
                      <span className="font-outfit font-semibold text-sm text-gym-black">
                        {set.weight}
                        <span className="text-xs font-normal text-gym-zinc-400 ml-0.5">
                          kg
                        </span>
                      </span>
                      <span className="text-gym-zinc-300">&times;</span>
                      <span className="font-outfit font-semibold text-sm text-gym-black">
                        {set.reps}
                        <span className="text-xs font-normal text-gym-zinc-400 ml-0.5">
                          回
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </>
  )
}
