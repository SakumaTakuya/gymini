import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/training')({
  component: TrainingPage,
})

function TrainingPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">トレーニング</h1>
      <p className="text-zinc-500 mt-2">トレーニングページ（プレースホルダー）</p>
    </div>
  )
}
