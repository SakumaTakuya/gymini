import { Lightning, Barbell } from '@phosphor-icons/react'

type IdleViewProps = {
  onStartTraining: () => void
}

export function IdleView({ onStartTraining }: IdleViewProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="flex-1 bg-zinc-50 pt-16 px-6 relative flex flex-col">
      <div className="flex items-center mb-12 gap-3">
        <div>
          <p className="text-xs text-zinc-500 font-medium">{dateStr}</p>
          <p className="font-outfit font-bold mt-0.5 text-black tracking-tight">
            さあ、始めよう
          </p>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 pb-20">
        <div className="w-48 h-48 rounded-full bg-zinc-200/50 flex items-center justify-center mb-8 relative">
          <div className="w-32 h-32 rounded-full bg-white shadow-sm flex items-center justify-center">
            <Barbell size={48} weight="duotone" className="text-zinc-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold font-outfit mb-2">準備はいいですか？</h2>
        <p className="text-zinc-500 text-sm text-center mb-10 w-4/5 leading-relaxed">
          フリーでトレーニングの記録を開始します。
        </p>
        <button
          type="button"
          onClick={onStartTraining}
          className="focus-ring w-[85%] h-13 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.3)] active:scale-95 transition-transform"
        >
          <Lightning size={20} weight="bold" className="text-accent" />
          トレーニングを始める
        </button>
      </div>
    </div>
  )
}
