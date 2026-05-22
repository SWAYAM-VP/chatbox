import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { ChatInput } from '@/components/chat/ChatInput'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { useChat } from '@/contexts/ChatContext'

export function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { messages, sending, loadingMessages, activeChat, sendMessage, openRouterConfigured, configured } = useChat()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen overflow-hidden text-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-[19rem]">
        <Navbar onToggleSidebar={() => setSidebarOpen((current) => !current)} />

        <main className="relative flex flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5">
            <div className="glass-soft rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{activeChat?.title ?? 'Start a new conversation'}</p>
                  <p className="text-sm text-slate-400">
                    {configured
                      ? openRouterConfigured
                        ? 'Your chat is connected to OpenRouter and Supabase.'
                        : 'Supabase is ready. Add your OpenRouter key to enable live replies.'
                      : 'Set your environment variables to connect Supabase and OpenRouter.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {messages.length} messages
                </div>
              </div>
            </div>

            <section className="glass-panel scrollbar-thin flex flex-1 flex-col rounded-[2rem] p-4 sm:p-6">
              <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto pr-1 sm:pr-2">
                {loadingMessages && (
                  <div className="flex h-full items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/4 p-8 text-center text-slate-400">
                    Loading conversation...
                  </div>
                )}

                {!loadingMessages && messages.length === 0 && (
                  <div className="flex h-full min-h-[18rem] items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/4 p-8 text-center">
                    <div>
                      <h2 className="text-xl font-bold text-white">Ask something bold.</h2>
                      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                        Use the composer below to start a new chat. The first message becomes the conversation title.
                      </p>
                    </div>
                  </div>
                )}

                {!loadingMessages && messages.map((message) => <MessageBubble key={message.id} message={message} />)}
              </div>

              <div className="mt-5">
                <ChatInput disabled={sending} onSend={sendMessage} />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}