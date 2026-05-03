import { useRef, useState, useEffect, type ChangeEvent } from 'react'
import { useUserProfileStore, TRAINING_GOALS, type TrainingGoal, type UserProfile } from '@/stores/userProfileStore'
import { Input } from '@/components/ui/input'
import { SectionCard } from './SectionCard'

const DEBOUNCE_MS = 300
const SAVED_HOLD_MS = 1500

type SaveStatus = 'idle' | 'saving' | 'saved'

const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  muscle_gain: '筋肥大（サイズアップ）',
  strength: '筋力アップ（パワー）',
  fat_loss: '減量・ダイエット',
  maintenance: '維持・健康増進',
  performance: '競技パフォーマンス向上',
}

function toNumberOrNull(value: string): number | null {
  const n = Number(value)
  return value === '' || Number.isNaN(n) ? null : n
}

export function UserProfileSection() {
  const setProfile = useUserProfileStore((s) => s.setProfile)

  // __root.tsx の loadProfile() は設定画面遷移前に実行済みのため、
  // lazy initializer でマウント時点の確定値を取得できる
  const [localBirthYear, setLocalBirthYear] = useState(() => {
    const { birthYear } = useUserProfileStore.getState().profile
    return birthYear !== null ? String(birthYear) : ''
  })
  const [localWeightKg, setLocalWeightKg] = useState(() => {
    const { weightKg } = useUserProfileStore.getState().profile
    return weightKg !== null ? String(weightKg) : ''
  })
  const [localHeightCm, setLocalHeightCm] = useState(() => {
    const { heightCm } = useUserProfileStore.getState().profile
    return heightCm !== null ? String(heightCm) : ''
  })
  const [localTrainingGoal, setLocalTrainingGoal] = useState<TrainingGoal | ''>(() => {
    return useUserProfileStore.getState().profile.trainingGoal ?? ''
  })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current)
      if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current)
    }
  }, [])

  function scheduleSave(patch: Partial<UserProfile>) {
    setSaveStatus('saving')
    if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current)
    if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      setProfile(patch)
      setSaveStatus('saved')
      savedTimerRef.current = setTimeout(() => {
        savedTimerRef.current = null
        setSaveStatus('idle')
      }, SAVED_HOLD_MS)
    }, DEBOUNCE_MS)
  }

  function handleBirthYearChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setLocalBirthYear(value)
    scheduleSave({ birthYear: toNumberOrNull(value) })
  }

  function handleWeightChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setLocalWeightKg(value)
    scheduleSave({ weightKg: toNumberOrNull(value) })
  }

  function handleHeightChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setLocalHeightCm(value)
    scheduleSave({ heightCm: toNumberOrNull(value) })
  }

  function handleGoalChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as TrainingGoal | ''
    setLocalTrainingGoal(value)
    scheduleSave({ trainingGoal: value === '' ? null : value })
  }

  return (
    <SectionCard label="プロフィール">
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gym-zinc-500">AI コーチ用プロフィール</p>
          <span
            className="text-[10px] font-medium text-gym-zinc-400 min-h-[1em]"
            aria-live="polite"
          >
            {saveStatus === 'saving' && '保存中…'}
            {saveStatus === 'saved' && '保存済み'}
          </span>
        </div>

        {/* 生まれ年 */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-birth-year"
            className="block text-xs font-medium text-gym-zinc-500"
          >
            生まれ年
          </label>
          <Input
            id="profile-birth-year"
            type="number"
            min={1900}
            max={2025}
            value={localBirthYear}
            onChange={handleBirthYearChange}
            placeholder="1990"
            suffix={<span className="text-xs text-gym-zinc-400">年</span>}
          />
        </div>

        {/* 体重 */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-weight"
            className="block text-xs font-medium text-gym-zinc-500"
          >
            体重
          </label>
          <Input
            id="profile-weight"
            type="number"
            min={1}
            max={300}
            value={localWeightKg}
            onChange={handleWeightChange}
            placeholder="70"
            suffix={<span className="text-xs text-gym-zinc-400">kg</span>}
          />
        </div>

        {/* 身長 */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-height"
            className="block text-xs font-medium text-gym-zinc-500"
          >
            身長
          </label>
          <Input
            id="profile-height"
            type="number"
            min={50}
            max={250}
            value={localHeightCm}
            onChange={handleHeightChange}
            placeholder="175"
            suffix={<span className="text-xs text-gym-zinc-400">cm</span>}
          />
        </div>

        {/* トレーニング目的 */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-training-goal"
            className="block text-xs font-medium text-gym-zinc-500"
          >
            トレーニング目的
          </label>
          <div className="flex items-center bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-gym-black focus-within:ring-offset-2 focus-within:ring-offset-white">
            <select
              id="profile-training-goal"
              value={localTrainingGoal}
              onChange={handleGoalChange}
              className="w-full bg-transparent text-base font-medium outline-none text-gym-black appearance-none cursor-pointer"
            >
              <option value="">選択してください</option>
              {TRAINING_GOALS.map((goal) => (
                <option key={goal} value={goal}>
                  {TRAINING_GOAL_LABELS[goal]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
