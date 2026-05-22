export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  chat_id: string
  user_id: string
  role: ChatRole
  content: string
  created_at: string
}

export interface ChatMessageUI {
  id: string
  role: Exclude<ChatRole, 'system'>
  content: string
  created_at?: string
  isLoading?: boolean
}