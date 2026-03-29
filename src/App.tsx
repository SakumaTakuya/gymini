import './index.css'
import useNavigation from './hooks/useNavigation'
import TrainingPage from './pages/TrainingPage'
import HistoryPage from './pages/HistoryPage'
import BottomNav from './components/BottomNav'

export default function App() {
  const { currentRoute } = useNavigation()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 flex flex-col min-h-0">
        {currentRoute === 'training' && <TrainingPage />}
        {currentRoute === 'history' && <HistoryPage />}
      </div>
      <BottomNav />
    </div>
  )
}
