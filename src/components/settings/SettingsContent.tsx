import { APIKeySection } from './APIKeySection'
import { ExerciseMasterSection } from './ExerciseMasterSection'

export function SettingsContent() {
  return (
    <div className="px-4 pt-20 pb-8 space-y-6">
      <h1 className="text-2xl font-outfit font-bold">設定</h1>
      <APIKeySection />
      <ExerciseMasterSection />
    </div>
  )
}
