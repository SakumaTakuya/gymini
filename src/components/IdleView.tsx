import { Settings } from 'lucide-react'

interface IdleViewProps {
  onStartTraining: () => void
  onOpenSettings: () => void
}

export default function IdleView({ onStartTraining, onOpenSettings }: IdleViewProps) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 gap-6">
      <div className="text-center">
        <h2 className="font-outfit font-extrabold text-[28px] tracking-[-1px]">今日もやりましょう！</h2>
        <p className="font-inter text-zinc-500 mt-1">トレーニングを記録して目標に近づこう</p>
      </div>

      <button
        className="min-h-[44px] min-w-[44px] h-[52px] rounded-2xl bg-black text-white font-outfit font-bold text-base px-8"
        onClick={onStartTraining}
      >
        トレーニングを開始
      </button>

      <button
        className="min-h-[44px] min-w-[44px] flex items-center gap-2 text-zinc-500 font-inter text-sm"
        onClick={onOpenSettings}
        aria-label="設定"
      >
        <Settings size={18} />
        設定
      </button>
    </div>
  )
}
