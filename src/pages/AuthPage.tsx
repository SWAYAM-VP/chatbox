import { FormEvent, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'

type Mode = 'signin' | 'signup'

export function AuthPage() {
  const { session, configured } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const from = useMemo(
    () => (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/chat',
    [location.state],
  )

  if (session && configured) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = getSupabaseClient() as any
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          throw error
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) {
          throw error
        }

        setMessage('Check your email to confirm the account, then sign in.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel overflow-hidden rounded-[2.25rem] p-8 sm:p-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            <Sparkles className="h-4 w-4" />
            Modern AI chat experience
          </div>

          <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            A polished chatbox that feels fast, private, and alive.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Sign in with Supabase, keep every conversation in your own database, and chat through OpenRouter with a
            clean responsive interface built for desktop and mobile.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <FeatureCard title="Secure auth" text="Email/password authentication via Supabase Auth with protected routes." />
            <FeatureCard title="Persistent memory" text="Chats and messages are stored in Supabase so nothing disappears." />
            <FeatureCard title="Markdown output" text="Styled markdown with code blocks, lists, and links inside responses." />
            <FeatureCard title="Adaptive UI" text="Responsive sidebar, dark/light mode, and mobile-friendly interactions." />
          </div>
        </section>

        <section className="glass-panel rounded-[2.25rem] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">{mode === 'signin' ? 'Welcome back' : 'Create account'}</p>
              <p className="text-sm text-slate-400">
                {mode === 'signin'
                  ? 'Use your Supabase account to open the chat dashboard.'
                  : 'Create your account to start storing conversations.'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              Auth
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
              <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
              <TextInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>

            {message && <p className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}

            <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
            <span>{mode === 'signin' ? 'No account yet?' : 'Already have an account?'}</span>
            <button
              type="button"
              className="font-semibold text-cyan-300 transition hover:text-cyan-200"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
            <p className="font-semibold text-white">Environment variables</p>
            <p className="mt-2 leading-6">
              Add Supabase URL, anon key, and OpenRouter API key to a local .env file before starting the app.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/20">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  )
}