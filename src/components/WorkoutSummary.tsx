import { GymCard } from '@/components/GymCard'
import { Appear } from '@/components/motion/Appear'
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
      <div className="px-page mb-3">
        <h3 className="font-jp font-bold text-sm text-gym-zinc-500">
          {formatDateHeader(date)}
        </h3>
      </div>

      {workouts.map((workout, wi) => (
        <Appear key={workout.id} index={wi}>
        <GymCard
          className="mx-page mb-4 border border-gym-zinc-100"
        >
          <div className="flex flex-col gap-3">
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
        </GymCard>
        </Appear>
      ))}
    </>
  )
}
