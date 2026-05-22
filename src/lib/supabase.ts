import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function getConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getConfig()
  return Boolean(url && anonKey)
}

// Minimal in-memory mock for development when Supabase env vars are missing.
function createDevMock() {
  type Row = Record<string, any>

  const chats: Row[] = []
  const messages: Row[] = []

  const authState: {
    session: { user: { id: string; email: string } } | null
    subscribers: Set<Function>
  } = {
    session: { user: { id: 'dev-user', email: 'dev@local' } },
    subscribers: new Set<Function>(),
  }

  function notifyAuth() {
    for (const cb of authState.subscribers) {
      try {
        cb('SIGNED_IN', authState.session)
      } catch (e) {
        // ignore
      }
    }
  }

  function makeQuery(table: 'chats' | 'messages') {
    const state = {
      table,
      type: 'select' as 'select' | 'insert' | 'update',
      payload: null as any,
      filters: [] as Array<{ k: string; v: any }>,
      order: null as any,
      single: false,
      insertedRows: null as Row[] | null,
    }

    const q: any = {
      select: (/*cols?: string*/) => {
        // Keep insert/update context intact; Supabase commonly chains .insert(...).select().single().
        if (state.type === 'select') {
          state.type = 'select'
        }
        return q
      },
      order: (field: string, _opts?: { ascending?: boolean }) => {
        state.order = { field }
        return q
      },
      insert: (obj: any) => {
        state.type = 'insert'
        state.payload = obj
        return q
      },
      update: (obj: any) => {
        state.type = 'update'
        state.payload = obj
        return q
      },
      eq: (k: string, v: any) => {
        state.filters.push({ k, v })
        return q
      },
      single: () => {
        state.single = true
        return q
      },
      then: (resolve: any) => {
        ;(async () => {
          if (state.type === 'select') {
            const sourceRows = state.insertedRows ?? (table === 'chats' ? chats : messages)
            const rows = sourceRows.filter((r) => {
              return state.filters.every((f) => r[f.k] === f.v)
            })

            resolve({ data: state.single ? rows[0] ?? null : rows, error: null })
          } else if (state.type === 'insert') {
            const payload = Array.isArray(state.payload) ? state.payload : [state.payload]
            const inserted = payload.map((p) => {
              const id = crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
              const now = new Date().toISOString()
              const row = { id, ...p, created_at: now, updated_at: now }
              if (table === 'chats') chats.unshift(row)
              else messages.push(row)
              return row
            })

            state.insertedRows = inserted
            state.type = 'select'

            const data = state.single ? inserted[0] : inserted
            resolve({ data, error: null })
          } else if (state.type === 'update') {
            const updated: Row[] = []
            const store = table === 'chats' ? chats : messages
            for (const r of store) {
              const match = state.filters.every((f) => r[f.k] === f.v)
              if (match) {
                Object.assign(r, state.payload)
                r.updated_at = new Date().toISOString()
                updated.push(r)
              }
            }

            resolve({ data: updated, error: null })
          } else {
            resolve({ data: null, error: new Error('Unsupported mock query') })
          }
        })()
      },
    }

    return q
  }

  const mock: any = {
    auth: {
      getSession: async () => ({ data: { session: authState.session }, error: null }),
      signInWithPassword: async ({ email }: { email: string }) => {
        authState.session = { user: { id: 'dev-user', email } }
        notifyAuth()
        return { data: null, error: null }
      },
      signUp: async ({ email }: { email: string }) => {
        authState.session = { user: { id: 'dev-user', email } }
        notifyAuth()
        return { data: null, error: null }
      },
      signOut: async () => {
        authState.session = null
        notifyAuth()
      },
      onAuthStateChange: (cb: Function) => {
        authState.subscribers.add(cb)
        // call immediately with current session
        try {
          cb('SIGNED_IN', authState.session)
        } catch (e) {
          // ignore
        }

        return { data: { subscription: { unsubscribe: () => authState.subscribers.delete(cb) } } }
      },
    },
    from: (table: 'chats' | 'messages') => makeQuery(table),
  }

  return mock
}

export function getSupabaseClient() {
  if (client) {
    return client
  }

  const { url, anonKey } = getConfig()

  if (!url || !anonKey) {
    // return a minimal in-memory mock client to allow local development without setting env vars
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    client = createDevMock()
    return client
  }

  client = createClient(url, anonKey)
  return client
}