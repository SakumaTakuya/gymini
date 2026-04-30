import { UserProfileSection } from './UserProfileSection'
import { APIKeySection } from './APIKeySection'
import { ExerciseMasterSection } from './ExerciseMasterSection'

export function SettingsContent() {
  return (
    <div className="pt-16 pb-12 px-4 space-y-6">
      <UserProfileSection />
      <APIKeySection />
      <ExerciseMasterSection />
    </div>
  )
}
