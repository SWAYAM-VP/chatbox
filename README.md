# Nova Chatbox

Modern AI chat UI built with React, Vite, Tailwind CSS, Supabase Auth, Supabase storage, and OpenRouter.

## Features

- Email/password auth with Supabase
- Protected routes
- Responsive chat layout with collapsible sidebar
- New chat creation and persistent chat history
- Markdown rendering for assistant replies
- Typing/loading animation
- Dark and light mode
- Mobile-friendly layout

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Fill in your Supabase and OpenRouter values.
4. Run `npm run dev`.

## Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENROUTER_API_KEY`
- `VITE_OPENROUTER_MODEL`

## Supabase schema

Create these tables in your Supabase project:

```sql
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chats enable row level security;
alter table public.messages enable row level security;

create policy "Users can read own chats"
on public.chats for select
using (auth.uid() = user_id);

create policy "Users can insert own chats"
on public.chats for insert
with check (auth.uid() = user_id);

create policy "Users can update own chats"
on public.chats for update
using (auth.uid() = user_id);

create policy "Users can read own messages"
on public.messages for select
using (auth.uid() = user_id);

create policy "Users can insert own messages"
on public.messages for insert
with check (auth.uid() = user_id);
```

## Notes

This is frontend-only. The OpenRouter API key lives in a local `.env` file so it is not hardcoded, but any browser-side key can still be inspected by the client at runtime. For stronger secrecy, proxy OpenRouter through a backend or Supabase Edge Function.