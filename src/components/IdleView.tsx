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
    <div className="flex-1 bg-gym-zinc-50 px-6 pt-6 relative flex flex-col">
      <div className="mb-10">
        <p className="text-xs text-gym-zinc-400 font-medium">{dateStr}</p>
        <p className="font-outfit font-bold mt-0.5 text-gym-black tracking-tight">
          さあ、始めよう
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center pb-20 gap-8">
        <div className="relative">
          <div className="w-28 h-28 bg-gym-black rounded-[28px] flex items-center justify-center shadow-float">
            <Barbell size={52} weight="bold" className="text-gym-white" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gym-accent rounded-full" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold font-outfit text-gym-black mb-2 tracking-tight">
            準備はいいですか？
          </h2>
          <p className="text-gym-zinc-500 text-sm text-center w-4/5 mx-auto leading-relaxed">
            フリーでトレーニングの記録を開始します。
          </p>
        </div>
        <button
          type="button"
          onClick={onStartTraining}
          className="focus-ring w-[85%] h-13 bg-gym-black text-gym-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-float active:scale-95 transition-transform"
        >
          <Lightning size={20} weight="bold" className="text-gym-accent" />
          トレーニングを始める
        </button>
      </div>
    </div>
  )
}
