type LiveStrengthProgressBarProps = {
  percent: number
}

function LiveStrengthProgressBar({ percent }: LiveStrengthProgressBarProps) {
  const safePercent = Math.max(0, Math.min(100, percent))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
          Session progress
        </p>
        <p className="text-sm font-semibold text-stone-900 dark:text-white">{safePercent}%</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-300 transition-all"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  )
}

export default LiveStrengthProgressBar
