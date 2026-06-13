import { UserProfileSection } from './UserProfileSection'
import { APIKeySection } from './APIKeySection'
import { ModelSelectSection } from './ModelSelectSection'
import { ExerciseMasterSection } from './ExerciseMasterSection'

export function SettingsContent() {
  return (
    <div className="pb-12 px-4 space-y-6">
      <UserProfileSection />
      <APIKeySection />
      <ModelSelectSection />
      <ExerciseMasterSection />
    </div>
  )
}
