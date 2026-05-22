import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import type { ChatMessageUI } from '@/types/chat'
import { TypingIndicator } from './TypingIndicator'

interface MessageBubbleProps {
  message: ChatMessageUI
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex items-end gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-lg shadow-cyan-500/10">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[min(100%,42rem)] rounded-3xl px-4 py-3 text-sm leading-6 shadow-xl',
          isUser
            ? 'rounded-br-md bg-cyan-400 text-slate-950'
            : 'rounded-bl-md border border-white/10 bg-white/8 text-slate-100 backdrop-blur',
        )}
      >
        {message.isLoading ? (
          <TypingIndicator />
        ) : isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-invert max-w-none prose-p:my-2 prose-p:leading-7 prose-a:text-cyan-300 prose-strong:text-white prose-code:rounded-lg prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-slate-950/80">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        <div className={cn('mt-2 text-[11px] uppercase tracking-[0.16em]', isUser ? 'text-slate-950/60' : 'text-slate-400')}>
          {formatTime(message.created_at)}
        </div>
      </div>

      {isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/90">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}