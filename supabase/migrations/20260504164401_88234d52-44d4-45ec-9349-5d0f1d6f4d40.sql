
-- Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task-attachments', 'task-attachments', false, 2097152, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
create policy "task-attachments read auth"
on storage.objects for select to authenticated
using (bucket_id = 'task-attachments');

create policy "task-attachments insert auth"
on storage.objects for insert to authenticated
with check (bucket_id = 'task-attachments');

create policy "task-attachments update auth"
on storage.objects for update to authenticated
using (bucket_id = 'task-attachments');

create policy "task-attachments delete owner or admin"
on storage.objects for delete to authenticated
using (bucket_id = 'task-attachments' and (owner = auth.uid() or public.is_admin(auth.uid())));

-- Anexos table
create table public.tarefa_anexos (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create index idx_tarefa_anexos_tarefa on public.tarefa_anexos(tarefa_id);
create index idx_tarefa_anexos_created on public.tarefa_anexos(created_at desc);

alter table public.tarefa_anexos enable row level security;

create policy "anexos select auth" on public.tarefa_anexos for select to authenticated using (true);
create policy "anexos insert auth" on public.tarefa_anexos for insert to authenticated with check (uploaded_by = auth.uid());
create policy "anexos delete owner or admin" on public.tarefa_anexos for delete to authenticated using (uploaded_by = auth.uid() or public.is_admin(auth.uid()));

-- Validation trigger
create or replace function public.validate_tarefa_anexo()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.size_bytes > 2097152 then
    raise exception 'Arquivo excede o limite de 2MB (% bytes)', new.size_bytes;
  end if;
  if new.mime_type not in ('image/jpeg','image/png','image/webp','image/gif','image/svg+xml') then
    raise exception 'Formato não suportado: %. Use JPG, PNG, WEBP, GIF ou SVG.', new.mime_type;
  end if;
  return new;
end; $$;

create trigger trg_validate_tarefa_anexo
before insert on public.tarefa_anexos
for each row execute function public.validate_tarefa_anexo();

-- Historico table
create table public.tarefa_anexos_historico (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null,
  anexo_id uuid,
  acao text not null check (acao in ('upload','remocao')),
  file_name text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);

create index idx_anexos_hist_tarefa on public.tarefa_anexos_historico(tarefa_id, created_at desc);

alter table public.tarefa_anexos_historico enable row level security;

create policy "hist select auth" on public.tarefa_anexos_historico for select to authenticated using (true);
create policy "hist insert auth" on public.tarefa_anexos_historico for insert to authenticated with check (true);

-- Trigger to log history
create or replace function public.log_tarefa_anexo()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.tarefa_anexos_historico (tarefa_id, anexo_id, acao, file_name, user_id)
    values (new.tarefa_id, new.id, 'upload', new.file_name, new.uploaded_by);
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.tarefa_anexos_historico (tarefa_id, anexo_id, acao, file_name, user_id)
    values (old.tarefa_id, old.id, 'remocao', old.file_name, auth.uid());
    return old;
  end if;
  return null;
end; $$;

create trigger trg_log_tarefa_anexo_ins
after insert on public.tarefa_anexos
for each row execute function public.log_tarefa_anexo();

create trigger trg_log_tarefa_anexo_del
after delete on public.tarefa_anexos
for each row execute function public.log_tarefa_anexo();
