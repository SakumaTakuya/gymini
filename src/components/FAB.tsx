interface FABProps {
  visible: boolean
  onClick: () => void
}

export default function FAB({ visible, onClick }: FABProps) {
  return (
    <button
      className={[
        'min-h-[44px] min-w-[44px] rounded-full bg-black text-white flex items-center justify-center',
        'font-outfit font-bold text-2xl leading-none',
        visible ? '' : 'invisible pointer-events-none',
      ].join(' ')}
      onClick={onClick}
      aria-label="種目を追加"
    >
      +
    </button>
  )
}
