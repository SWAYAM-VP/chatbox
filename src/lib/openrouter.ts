import type { ChatMessageUI } from '@/types/chat'

const DEFAULT_MODEL = 'openrouter/auto'

export function isOpenRouterConfigured() {
  return Boolean(import.meta.env.VITE_OPENROUTER_API_KEY)
}

function getModel() {
  return import.meta.env.VITE_OPENROUTER_MODEL || DEFAULT_MODEL
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const maybeError = (payload as { error?: { message?: string } }).error
  return maybeError?.message || fallback
}

async function requestCompletion(model: string, messages: ChatMessageUI[]) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Nova Chatbox',
    },
    body: JSON.stringify({
      model,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: 0.7,
    }),
  })

  let payload: any = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = getErrorMessage(payload, `OpenRouter request failed (${response.status}).`)
    throw new Error(message)
  }

  const choice = payload?.choices?.[0]
  const content = choice?.message?.content

  if (typeof content === 'string' && content.trim()) {
    return content.trim()
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim()

    if (text) {
      return text
    }
  }

  return 'I did not receive a response.'
}

async function getFreeFallbackModels() {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    return ['openrouter/auto']
  }

  let payload: any = null
  try {
    payload = await response.json()
  } catch {
    return ['openrouter/auto']
  }

  const ids = Array.isArray(payload?.data)
    ? payload.data
        .map((model: any) => model?.id)
        .filter((id: unknown): id is string => typeof id === 'string' && id.includes(':free'))
    : []

  // Keep the list short and deterministic; always include auto first.
  return ['openrouter/auto', ...ids.slice(0, 4)]
}

export async function generateAssistantReply(messages: ChatMessageUI[]) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('Missing OpenRouter API key.')
  }

  const preferredModel = getModel()

  try {
    return await requestCompletion(preferredModel, messages)
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : 'OpenRouter request failed.'

    // If preferred model has no active endpoint (common on free models), retry with dynamic fallback models.
    if (!/No endpoints found|model not found|unknown model/i.test(originalMessage)) {
      throw new Error(originalMessage)
    }

    const fallbacks = await getFreeFallbackModels()
    for (const model of fallbacks) {
      if (model === preferredModel) {
        continue
      }

      try {
        return await requestCompletion(model, messages)
      } catch {
        // keep trying fallback models
      }
    }

    throw new Error(originalMessage)
  }
}