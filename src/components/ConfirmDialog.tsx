type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'neutral'
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'neutral',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  const confirmClassName =
    tone === 'danger'
      ? 'bg-rose-500 text-white hover:bg-rose-400'
      : 'bg-cyan-300 text-slate-950 hover:bg-cyan-200'

  return (
    <div
      aria-label={title}
      aria-modal="true"
      className="modal-overlay z-[120] items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="modal-panel w-full max-w-sm overflow-y-auto rounded-[26px] border border-white/10 bg-white p-5 shadow-2xl dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-stone-950 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-neutral-300">{description}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="min-h-11 rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`min-h-11 rounded-[16px] px-3 py-2 text-sm font-semibold transition ${confirmClassName}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
