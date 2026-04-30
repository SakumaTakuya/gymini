import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useUserProfileStore, TRAINING_GOALS, type TrainingGoal, type UserProfile } from '@/stores/userProfileStore'
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
  const profile = useUserProfileStore((s) => s.profile)
  const setProfile = useUserProfileStore((s) => s.setProfile)

  const [localBirthYear, setLocalBirthYear] = useState(
    profile.birthYear !== null ? String(profile.birthYear) : '',
  )
  const [localWeightKg, setLocalWeightKg] = useState(
    profile.weightKg !== null ? String(profile.weightKg) : '',
  )
  const [localHeightCm, setLocalHeightCm] = useState(
    profile.heightCm !== null ? String(profile.heightCm) : '',
  )
  const [localTrainingGoal, setLocalTrainingGoal] = useState<TrainingGoal | ''>(
    profile.trainingGoal ?? '',
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 外部からの変更（loadProfile）を入力欄に反映
  useEffect(() => {
    setLocalBirthYear(profile.birthYear !== null ? String(profile.birthYear) : '')
    setLocalWeightKg(profile.weightKg !== null ? String(profile.weightKg) : '')
    setLocalHeightCm(profile.heightCm !== null ? String(profile.heightCm) : '')
    setLocalTrainingGoal(profile.trainingGoal ?? '')
  }, [profile])

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
          <div className="flex items-center gap-2 bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200">
            <input
              id="profile-birth-year"
              type="number"
              min={1900}
              max={2025}
              value={localBirthYear}
              onChange={handleBirthYearChange}
              placeholder="1990"
              className="flex-1 bg-transparent text-base font-medium outline-none text-gym-black"
            />
            <span className="text-xs text-gym-zinc-400">年</span>
          </div>
        </div>

        {/* 体重 */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-weight"
            className="block text-xs font-medium text-gym-zinc-500"
          >
            体重
          </label>
          <div className="flex items-center gap-2 bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200">
            <input
              id="profile-weight"
              type="number"
              min={1}
              max={300}
              value={localWeightKg}
              onChange={handleWeightChange}
              placeholder="70"
              className="flex-1 bg-transparent text-base font-medium outline-none text-gym-black"
            />
            <span className="text-xs text-gym-zinc-400">kg</span>
          </div>
        </div>

        {/* 身長 */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-height"
            className="block text-xs font-medium text-gym-zinc-500"
          >
            身長
          </label>
          <div className="flex items-center gap-2 bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200">
            <input
              id="profile-height"
              type="number"
              min={50}
              max={250}
              value={localHeightCm}
              onChange={handleHeightChange}
              placeholder="175"
              className="flex-1 bg-transparent text-base font-medium outline-none text-gym-black"
            />
            <span className="text-xs text-gym-zinc-400">cm</span>
          </div>
        </div>

        {/* トレーニング目的 */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-training-goal"
            className="block text-xs font-medium text-gym-zinc-500"
          >
            トレーニング目的
          </label>
          <div className="bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200 flex items-center">
            <select
              id="profile-training-goal"
              value={localTrainingGoal}
              onChange={handleGoalChange}
              className="w-full bg-transparent text-base font-medium outline-none text-gym-black appearance-none cursor-pointer focus-ring rounded-lg"
            >
              <option value="">未設定</option>
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
