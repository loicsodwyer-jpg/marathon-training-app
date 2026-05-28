import { ArrowLeft, ClipboardCheck, Trash2 } from 'lucide-react'

type ChatGptJsonPasteBoxProps = {
  errors: string[]
  message?: string
  value: string
  onBackToPrompt: () => void
  onChange: (value: string) => void
  onClear: () => void
  onValidate: () => void
}

function ChatGptJsonPasteBox({
  errors,
  message,
  onBackToPrompt,
  onChange,
  onClear,
  onValidate,
  value,
}: ChatGptJsonPasteBoxProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-purple-100 bg-purple-50/80 p-4 dark:border-purple-300/20 dark:bg-purple-300/10">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
          Paste response
        </p>
        <h3 className="mt-1 text-lg font-semibold text-stone-950 dark:text-white">
          Validate ChatGPT JSON
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-neutral-300">
          Paste the JSON response from ChatGPT here. The app validates it locally before showing
          a preview or allowing approval.
        </p>
      </section>

      {message ? (
        <p className="rounded-[18px] border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
          {message}
        </p>
      ) : null}

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-stone-800 dark:text-neutral-100"
          htmlFor="chatgpt-adjustment-json"
        >
          ChatGPT JSON response
        </label>
        <textarea
          className="min-h-[320px] w-full resize-y rounded-[20px] border border-stone-200 bg-white p-3 font-mono text-xs leading-5 text-stone-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:border-white/10 dark:bg-neutral-950/70 dark:text-neutral-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300/20"
          id="chatgpt-adjustment-json"
          onChange={(event) => onChange(event.target.value)}
          placeholder='{"adjustmentTitle":"...","summary":"...","changes":[...]}'
          value={value}
        />
      </div>

      {errors.length ? (
        <section className="rounded-[20px] border border-red-100 bg-red-50 p-4 dark:border-red-300/20 dark:bg-red-300/10">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-100">
            Validation errors
          </h4>
          <ul className="mt-2 space-y-2">
            {errors.map((error) => (
              <li className="text-sm leading-5 text-red-800/80 dark:text-red-100/80" key={error}>
                {error}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-2">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-cyan-300 dark:text-neutral-950 dark:hover:bg-cyan-200"
          onClick={onValidate}
          type="button"
        >
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          Validate response
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100 dark:hover:bg-white/[0.1]"
          onClick={onClear}
          type="button"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Clear
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100 dark:hover:bg-white/[0.1]"
          onClick={onBackToPrompt}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to prompt
        </button>
      </div>
    </div>
  )
}

export default ChatGptJsonPasteBox
