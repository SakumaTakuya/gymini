import useNavigationStore from '../stores/navigationStore'
import type { Route } from '../types'

interface UseNavigationReturn {
  currentRoute: Route
  navigate: (route: Route) => void
}

export default function useNavigation(): UseNavigationReturn {
  const currentRoute = useNavigationStore((s) => s.currentRoute)
  const navigate = useNavigationStore((s) => s.navigate)
  return { currentRoute, navigate }
}
