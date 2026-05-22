import { Menu, MoonStar, LogOut, Sparkles, SunMedium } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface NavbarProps {
  onToggleSidebar: () => void
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-white/10 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <Button tone="secondary" className="h-11 w-11 rounded-2xl p-0 lg:hidden" onClick={onToggleSidebar} aria-label="Open sidebar">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">Nova Chatbox</p>
            <p className="text-xs text-slate-400">OpenRouter + Supabase</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Button tone="secondary" className="h-11 w-11 rounded-2xl p-0" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </Button>

          <div className={cn('hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right sm:block')}>
            <p className="text-sm font-medium text-white">{user?.email}</p>
            <p className="text-xs text-slate-400">Signed in securely</p>
          </div>

          <Button tone="secondary" onClick={() => void signOut()} className="h-11 rounded-2xl px-4">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}