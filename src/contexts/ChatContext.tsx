import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { generateAssistantReply, isOpenRouterConfigured } from '@/lib/openrouter'
import type { ChatMessage, ChatMessageUI, ChatSummary } from '@/types/chat'
import { useAuth } from '@/contexts/AuthContext'
import { truncate } from '@/lib/utils'

interface ChatContextValue {
  chats: ChatSummary[]
  activeChatId: string | null
  activeChat: ChatSummary | null
  messages: ChatMessageUI[]
  loadingChats: boolean
  loadingMessages: boolean
  sending: boolean
  configured: boolean
  openRouterConfigured: boolean
  selectChat: (chatId: string) => Promise<void>
  startNewChat: () => Promise<void>
  sendMessage: (value: string) => Promise<void>
}

interface ChatRow {
  id: string
  title: string
  created_at: string
  updated_at: string
}

const ChatContext = createContext<ChatContextValue | null>(null)

const NEW_CHAT_TITLE = 'New chat'

function mapMessages(rows: ChatMessage[]): ChatMessageUI[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content,
    created_at: row.created_at,
  }))
}

function buildTitle(firstUserMessage?: string) {
  if (!firstUserMessage) {
    return NEW_CHAT_TITLE
  }

  return truncate(firstUserMessage, 42)
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  // Try to obtain a Supabase client (real or mock). This enables local dev without env vars.
  let supabaseClient = null
  try {
    supabaseClient = getSupabaseClient()
  } catch (e) {
    supabaseClient = null
  }

  const configured = Boolean(supabaseClient)
  const openRouterConfigured = isOpenRouterConfigured()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageUI[]>([])
  const [loadingChats, setLoadingChats] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const hasInitialized = useRef(false)

  const supabase = supabaseClient as any

  useEffect(() => {
    if (authLoading || !user || !supabase) {
      return
    }

    let mounted = true

    setLoadingChats(true)

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('id, title, created_at, updated_at')
          .order('updated_at', { ascending: false })

        if (!mounted) {
          return
        }

        if (error) {
          throw error
        }

        const nextChats = (data ?? []) as ChatRow[]
        setChats(nextChats)

        if (!hasInitialized.current) {
          hasInitialized.current = true
          const preferredChatId = window.localStorage.getItem('nova-last-chat')
          const nextChatId = nextChats.find((chat) => chat.id === preferredChatId)?.id ?? nextChats[0]?.id ?? null

          if (nextChatId) {
            void loadChat(nextChatId)
          } else {
            void createChat()
          }
        }
      } catch (error) {
        console.error(error)
        setChats([])
      } finally {
        if (mounted) {
          setLoadingChats(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [authLoading, configured, user?.id])

  async function loadChat(chatId: string) {
    if (!supabase) {
      return
    }

    setActiveChatId(chatId)
    window.localStorage.setItem('nova-last-chat', chatId)
    setLoadingMessages(true)

    const { data: rows, error: messagesError } = await supabase
      .from('messages')
      .select('id, chat_id, user_id, role, content, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    const { error: chatError } = await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId)

    if (chatError) {
      console.error(chatError)
    }

    if (messagesError) {
      console.error(messagesError)
      setMessages([])
    } else {
      setMessages(mapMessages(rows ?? []))
    }

    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId ? { ...chat, updated_at: new Date().toISOString() } : chat,
      ),
    )
    setLoadingMessages(false)
  }

  async function createChat(initialTitle = NEW_CHAT_TITLE) {
    if (!supabase || !user) {
      return
    }

    const title = initialTitle
    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, title })
      .select('id, title, created_at, updated_at')
      .single()

    if (error || !data) {
      console.error(error)
      return
    }

    const nextChat = data
    setChats((current) => [nextChat, ...current.filter((chat) => chat.id !== nextChat.id)])
    await loadChat(nextChat.id)
  }

  async function selectChat(chatId: string) {
    if (chatId === activeChatId) {
      return
    }

    await loadChat(chatId)
  }

  async function startNewChat() {
    setMessages([])
    setActiveChatId(null)
    await createChat()
  }

  async function persistMessage(chatId: string, role: 'user' | 'assistant', content: string) {
    if (!supabase || !user) {
      return
    }

    await supabase.from('messages').insert({
      chat_id: chatId,
      user_id: user.id,
      role,
      content,
    })
  }

  async function updateChatTitle(chatId: string, title: string) {
    if (!supabase) {
      return
    }

    const nextUpdated = new Date().toISOString()
    await supabase.from('chats').update({ title, updated_at: nextUpdated }).eq('id', chatId)
    setChats((current) =>
      current.map((chat) => (chat.id === chatId ? { ...chat, title, updated_at: nextUpdated } : chat)),
    )
  }

  async function sendMessage(value: string) {
    if (!supabase || !user) {
      return
    }

    const content = value.trim()
    if (!content || sending) {
      return
    }

    let chatId = activeChatId
    let shouldRenameChat = false

    if (!chatId) {
      const created = await supabase
        .from('chats')
        .insert({ user_id: user.id, title: NEW_CHAT_TITLE })
        .select('id, title, created_at, updated_at')
        .single()

      if (created.error || !created.data) {
        console.error(created.error)
        return
      }

      const createdChatId = created.data.id
      chatId = createdChatId
      shouldRenameChat = true
      setChats((current) => [created.data, ...current])
      setActiveChatId(createdChatId)
      window.localStorage.setItem('nova-last-chat', createdChatId)
    } else if (chats.find((chat) => chat.id === chatId)?.title === NEW_CHAT_TITLE) {
      shouldRenameChat = true
    }

    if (!chatId) {
      return
    }

    const optimisticUserMessage: ChatMessageUI = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    const loadingMessageId = crypto.randomUUID()
    const optimisticLoadingMessage: ChatMessageUI = {
      id: loadingMessageId,
      role: 'assistant',
      content: '',
      isLoading: true,
      created_at: new Date().toISOString(),
    }

    setMessages((current) => [...current, optimisticUserMessage, optimisticLoadingMessage])
    setSending(true)

    try {
      await persistMessage(chatId, 'user', content)

      // capture a fresh snapshot of messages including the optimistic user message
      const snapshot = [...messages, optimisticUserMessage]

      let reply: string

      if (openRouterConfigured) {
        try {
          reply = await generateAssistantReply(snapshot)
        } catch (e) {
          console.error('OpenRouter error:', e)
          reply = 'The AI service failed to respond; showing a fallback answer.'
        }
      } else {
        reply = 'OpenRouter not configured: showing a local fallback reply.'
      }

      // persist assistant reply (best-effort)
      try {
        await persistMessage(chatId, 'assistant', reply)
      } catch (e) {
        console.error('Failed to persist assistant message:', e)
      }

      const assistantMessage: ChatMessageUI = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      }

      // Replace the loading message with the assistant reply
      setMessages((current) => [...current.filter((message) => message.id !== loadingMessageId), assistantMessage])

      if (chatId && shouldRenameChat) {
        const title = buildTitle(content)
        await updateChatTitle(chatId, title)
      }

      setChats((current) =>
        current.map((chat) => (chat.id === chatId ? { ...chat, updated_at: new Date().toISOString() } : chat)),
      )
    } catch (error) {
      console.error('sendMessage error:', error)
      // Ensure the loading indicator is removed and a helpful assistant message is shown
      setMessages((current) => [
        ...current.filter((message) => message.id !== loadingMessageId),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'An error occurred while sending your message. Try again or check the console for details.',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null

  const value = useMemo<ChatContextValue>(
    () => ({
      chats,
      activeChatId,
      activeChat,
      messages,
      loadingChats,
      loadingMessages,
      sending,
      configured,
      openRouterConfigured,
      selectChat,
      startNewChat,
      sendMessage,
    }),
    [activeChat, activeChatId, chats, configured, loadingChats, loadingMessages, messages, openRouterConfigured, sending],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)

  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }

  return context
}