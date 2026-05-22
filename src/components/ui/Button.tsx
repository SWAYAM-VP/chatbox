import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button({ className, tone = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60',
        tone === 'primary' && 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
        tone === 'secondary' && 'bg-white/10 text-white hover:bg-white/15',
        tone === 'ghost' && 'bg-transparent text-slate-200 hover:bg-white/8',
        tone === 'danger' && 'bg-rose-500 text-white hover:bg-rose-400',
        className,
      )}
      {...props}
    />
  )
}