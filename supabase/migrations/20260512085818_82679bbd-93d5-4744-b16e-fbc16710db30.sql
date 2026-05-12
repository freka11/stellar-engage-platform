
-- MAILS
create table public.mails (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default '',
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index mails_recipient_idx on public.mails(recipient_id, created_at desc);
create index mails_sender_idx on public.mails(sender_id, created_at desc);

alter table public.mails enable row level security;

create policy "Participants can view mails"
  on public.mails for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id or public.has_role(auth.uid(), 'admin'));

create policy "Users can send mail as themselves"
  on public.mails for insert to authenticated
  with check (auth.uid() = sender_id);

create policy "Recipient can update read state"
  on public.mails for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create policy "Sender can delete own mail"
  on public.mails for delete to authenticated
  using (auth.uid() = sender_id);

-- MESSAGES (direct chat)
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_pair_idx on public.messages(sender_id, recipient_id, created_at desc);
create index messages_recipient_idx on public.messages(recipient_id, created_at desc);

alter table public.messages enable row level security;

create policy "Participants can view messages"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id or public.has_role(auth.uid(), 'admin'));

create policy "Users can send messages as themselves"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);

create policy "Recipient can mark messages read"
  on public.messages for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create policy "Sender can delete own message"
  on public.messages for delete to authenticated
  using (auth.uid() = sender_id);

alter publication supabase_realtime add table public.messages;
alter table public.messages replica identity full;
