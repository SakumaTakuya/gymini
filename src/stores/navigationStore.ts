import { create } from 'zustand'
import type { Route } from '../types'

interface NavigationStore {
  currentRoute: Route
  navigate: (route: Route) => void
}

const useNavigationStore = create<NavigationStore>()((set) => ({
  currentRoute: 'training',
  navigate: (route) => set({ currentRoute: route }),
}))

export default useNavigationStore
