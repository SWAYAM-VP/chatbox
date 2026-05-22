import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/Input'

interface ChatInputProps {
  disabled?: boolean
  onSend: (value: string) => Promise<void>
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const textArea = textAreaRef.current
    if (!textArea) {
      return
    }

    textArea.style.height = 'auto'
    textArea.style.height = `${Math.min(textArea.scrollHeight, 180)}px`
  }, [value])

  async function submitValue() {
    const trimmed = value.trim()
    if (!trimmed || disabled) {
      return
    }

    await onSend(trimmed)
    setValue('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitValue()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-[2rem] border-white/12 p-3 shadow-[0_18px_80px_rgba(15,23,42,0.35)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <TextArea
          ref={textAreaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void submitValue()
            }
          }}
          rows={1}
          placeholder="Ask anything, brainstorm ideas, draft replies, summarize notes..."
          disabled={disabled}
          className="min-h-[56px] flex-1 rounded-[1.4rem] border-white/10 bg-slate-950/40 px-4 py-4 text-[15px] leading-6"
        />

        <div className="flex gap-2 sm:flex-col">
          <Button type="submit" disabled={disabled || !value.trim()} className="min-h-[56px] min-w-[56px] rounded-[1.4rem] px-5">
            <ArrowUpRight className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Press Enter to send, Shift+Enter for a new line. Markdown renders automatically.
      </p>
    </form>
  )
}