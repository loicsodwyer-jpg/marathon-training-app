import { FileJson, Upload, X } from 'lucide-react'
import { useState } from 'react'
import type { BackupImportResult } from '../types/backup'
import { importFullBackup, validateBackupFile } from '../utils/backupUtils'

type ImportMode = 'replace' | 'merge'

type ImportBackupModalProps = {
  open: boolean
  onClose: () => void
  onImported: (result: BackupImportResult) => void
}

type Message = {
  tone: 'success' | 'error'
  text: string
}

function ImportBackupModal({ open, onClose, onImported }: ImportBackupModalProps) {
  const [selectedFile, setSelectedFile] = useState<File>()
  const [mode, setMode] = useState<ImportMode>('replace')
  const [message, setMessage] = useState<Message>()
  const [isImporting, setIsImporting] = useState(false)

  if (!open) {
    return null
  }

  const handleClose = () => {
    if (isImporting) {
      return
    }

    setSelectedFile(undefined)
    setMode('replace')
    setMessage(undefined)
    onClose()
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setMessage({ tone: 'error', text: 'Choose a JSON backup file first.' })
      return
    }

    setIsImporting(true)
    setMessage(undefined)

    try {
      const fileText = await selectedFile.text()
      const parsedValue: unknown = JSON.parse(fileText)

      if (!validateBackupFile(parsedValue)) {
        setMessage({ tone: 'error', text: 'This is not a valid Loïc Marathon backup file.' })
        return
      }

      const result = importFullBackup(parsedValue, { merge: mode === 'merge' })
      setMessage({ tone: result.success ? 'success' : 'error', text: result.message })

      if (result.success) {
        onImported(result)
      }
    } catch {
      setMessage({ tone: 'error', text: 'The selected file could not be read as JSON.' })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div
      aria-label="Import backup"
      aria-modal="true"
      className="modal-overlay z-[110] items-end justify-center bg-slate-950/70 px-4 backdrop-blur-sm sm:items-center"
      role="dialog"
    >
      <div className="modal-panel w-full max-w-md overflow-y-auto rounded-[28px] border border-white/10 bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl dark:bg-neutral-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200">
              <FileJson className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
                Import backup
              </h2>
              <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
                Restore a JSON backup exported from this app.
              </p>
            </div>
          </div>
          <button
            aria-label="Close import backup"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-stone-200 bg-stone-50 text-stone-600 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-300 dark:hover:bg-white/[0.1]"
            onClick={handleClose}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700 dark:text-neutral-200">
              Backup file
            </span>
            <input
              accept=".json,application/json"
              className="block w-full rounded-[18px] border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-stone-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white dark:border-white/10 dark:bg-neutral-950/70 dark:text-neutral-200 dark:file:bg-cyan-300 dark:file:text-neutral-950"
              onChange={(event) => setSelectedFile(event.target.files?.[0])}
              type="file"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-semibold text-stone-700 dark:text-neutral-200">
              Import mode
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                description="Replace current logs and calendar edits."
                isActive={mode === 'replace'}
                label="Replace"
                onClick={() => setMode('replace')}
              />
              <ModeButton
                description="Add backup data; same dates overwrite."
                isActive={mode === 'merge'}
                label="Merge"
                onClick={() => setMode('merge')}
              />
            </div>
          </div>

          {message ? (
            <p
              className={`rounded-[16px] border px-3 py-2 text-sm font-semibold ${
                message.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200'
                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200'
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              className="h-11 rounded-[16px] border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
              onClick={handleClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-cyan-300 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isImporting}
              onClick={handleImport}
              type="button"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {isImporting ? 'Importing' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModeButton({
  description,
  isActive,
  label,
  onClick,
}: {
  description: string
  isActive: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={isActive}
      className={`rounded-[18px] border p-3 text-left transition ${
        isActive
          ? 'border-cyan-300/40 bg-cyan-300/15 text-stone-950 dark:text-cyan-100'
          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-300 dark:hover:bg-white/[0.1]'
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="mt-1 block text-xs leading-4 opacity-80">{description}</span>
    </button>
  )
}

export default ImportBackupModal
