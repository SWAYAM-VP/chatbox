import { Plus, MessageSquareText, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn, truncate } from '@/lib/utils'
import { useChat } from '@/contexts/ChatContext'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { chats, activeChatId, selectChat, startNewChat, loadingChats } = useChat()

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'glass-panel fixed inset-y-0 left-0 z-50 flex w-[19rem] max-w-[88vw] flex-col border-r border-white/10 p-4 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:flex',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <div>
            <p className="text-sm font-semibold text-white">Chats</p>
            <p className="text-xs text-slate-400">Swipe or close when done</p>
          </div>
          <Button tone="secondary" className="h-10 w-10 rounded-2xl p-0" onClick={onClose} aria-label="Close sidebar">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => void startNewChat()} className="mb-4 h-12 w-full justify-start rounded-2xl">
          <Plus className="h-4 w-4" />
          New chat
        </Button>

        <div className="mb-3 flex items-center justify-between px-1 text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>Previous chats</span>
          <span>{chats.length}</span>
        </div>

        <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto pr-1">
          {loadingChats && <SidebarSkeleton />}

          {!loadingChats && chats.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-400">
              No conversations yet. Start a new chat to create one.
            </div>
          )}

          {chats.map((chat) => {
            const isActive = chat.id === activeChatId

            return (
              <button
                key={chat.id}
                onClick={() => {
                  void selectChat(chat.id)
                  onClose()
                }}
                className={cn(
                  'w-full rounded-3xl border px-4 py-3 text-left transition',
                  isActive
                    ? 'border-cyan-400/30 bg-cyan-400/12 shadow-lg shadow-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5 rounded-2xl p-2', isActive ? 'bg-cyan-400/15 text-cyan-300' : 'bg-white/8 text-slate-300')}>
                    <MessageSquareText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{chat.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{chat.updated_at ? truncate(new Date(chat.updated_at).toLocaleString(), 28) : 'Open chat'}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>
    </>
  )
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
          <div className="h-4 w-2/3 rounded-full bg-white/10" />
          <div className="mt-3 h-3 w-1/2 rounded-full bg-white/8" />
        </div>
      ))}
    </div>
  )
}