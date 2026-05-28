import { ArrowLeft, Clipboard, Download, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

type ChatGptPromptPreviewProps = {
  prompt: string
  onBack: () => void
  onContinue: () => void
}

function ChatGptPromptPreview({ onBack, onContinue, prompt }: ChatGptPromptPreviewProps) {
  const [copyMessage, setCopyMessage] = useState<string>()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopyMessage('Prompt copied.')
    } catch {
      setCopyMessage('Copy failed. Select the prompt text and copy it manually.')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `loic-marathon-chatgpt-adjustment-prompt-${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-purple-100 bg-purple-50/80 p-4 dark:border-purple-300/20 dark:bg-purple-300/10">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-300/15 dark:text-purple-200">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
              Manual fallback
            </p>
            <h3 className="mt-1 text-lg font-semibold text-stone-950 dark:text-white">
              Copy this prompt into ChatGPT
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-neutral-300">
              It contains the affected plan dates, recent logs, and the rule-based proposal you
              did not approve. Nothing is sent automatically; only the text you copy leaves this
              app.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-stone-800 dark:text-neutral-100"
          htmlFor="chatgpt-adjustment-prompt"
        >
          ChatGPT prompt
        </label>
        <textarea
          className="min-h-[360px] w-full resize-y rounded-[20px] border border-stone-200 bg-white p-3 font-mono text-xs leading-5 text-stone-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:border-white/10 dark:bg-neutral-950/70 dark:text-neutral-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300/20"
          id="chatgpt-adjustment-prompt"
          readOnly
          value={prompt}
        />
      </div>

      {copyMessage ? (
        <p className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
          {copyMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-2">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-cyan-300 dark:text-neutral-950 dark:hover:bg-cyan-200"
          onClick={handleCopy}
          type="button"
        >
          <Clipboard className="h-4 w-4" aria-hidden="true" />
          Copy prompt
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100 dark:hover:bg-white/[0.1]"
          onClick={handleDownload}
          type="button"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download prompt
        </button>
        <button
          className="min-h-11 rounded-[18px] border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 transition hover:bg-purple-100 dark:border-purple-300/20 dark:bg-purple-300/10 dark:text-purple-100 dark:hover:bg-purple-300/15"
          onClick={onContinue}
          type="button"
        >
          Continue to paste response
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100 dark:hover:bg-white/[0.1]"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to proposal
        </button>
      </div>
    </div>
  )
}

export default ChatGptPromptPreview
