-- Two-way live chat between anonymous public trackers and admins.
-- Same trust model as the rest of the public surface: anon gets zero table
-- grants, all public access goes through narrow SECURITY DEFINER RPCs called
-- from trusted Next.js server code via the service-role client.

begin;

create table public.shipment_chat_messages (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  sender_role text not null,
  body text not null,
  created_by uuid references auth.users (id) on delete set null,
  sender_display_name text,
  is_read_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  constraint shipment_chat_messages_sender_role
    check (sender_role in ('customer', 'admin')),
  constraint shipment_chat_messages_body_length
    check (char_length(btrim(body)) between 1 and 2000),
  constraint shipment_chat_messages_admin_actor check (
    (sender_role = 'admin' and created_by is not null)
    or (sender_role = 'customer' and created_by is null)
  )
);

comment on table public.shipment_chat_messages is
  'Two-way chat between an anonymous tracker (bearer: tracking_number) and admins. Distinct from the one-way public.shipment_messages broadcast table.';

create index shipment_chat_messages_timeline_idx
  on public.shipment_chat_messages (shipment_id, created_at desc, id desc);
create index shipment_chat_messages_unread_idx
  on public.shipment_chat_messages (shipment_id)
  where sender_role = 'customer' and not is_read_by_admin;

-- ---------------------------------------------------------------------------
-- Row preparation and actor stamping
-- ---------------------------------------------------------------------------

create function private.prepare_shipment_chat_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.body := btrim(new.body);
  return new;
end;
$$;

create function private.set_shipment_chat_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user uuid := auth.uid();
  acting_display_name text;
begin
  if new.sender_role = 'admin' then
    new.created_by := acting_user;
    select admin_profile.display_name
      into acting_display_name
    from public.admin_profiles as admin_profile
    where admin_profile.user_id = acting_user;
    new.sender_display_name := coalesce(acting_display_name, 'Administrator');
    new.is_read_by_admin := true;
  else
    new.created_by := null;
    new.sender_display_name := null;
  end if;
  return new;
end;
$$;

revoke all on function private.prepare_shipment_chat_message() from public, anon, authenticated;
revoke all on function private.set_shipment_chat_actor() from public, anon, authenticated;

create trigger shipment_chat_messages_prepare
before insert on public.shipment_chat_messages
for each row execute function private.prepare_shipment_chat_message();
create trigger shipment_chat_messages_set_actor
before insert on public.shipment_chat_messages
for each row execute function private.set_shipment_chat_actor();

create trigger audit_shipment_chat_messages
after insert or update or delete on public.shipment_chat_messages
for each row execute function private.audit_row_change();

-- ---------------------------------------------------------------------------
-- Admin row-level security (identical shape to shipment_messages_admin_all)
-- ---------------------------------------------------------------------------

alter table public.shipment_chat_messages enable row level security;

create policy shipment_chat_messages_admin_all
on public.shipment_chat_messages for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

revoke all on public.shipment_chat_messages from anon, authenticated;
grant select, insert, update, delete on public.shipment_chat_messages to authenticated;

-- ---------------------------------------------------------------------------
-- Hardened public RPCs
-- ---------------------------------------------------------------------------

create function public.get_shipment_chat_messages(p_tracking_number text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_tracking_number text := upper(btrim(coalesce(p_tracking_number, '')));
  matched_shipment_id uuid;
  message_payload jsonb;
begin
  if char_length(normalized_tracking_number) not between 4 and 64
     or normalized_tracking_number !~ '^[A-Z0-9][A-Z0-9-]{3,63}$' then
    return null;
  end if;

  select shipment.id
    into matched_shipment_id
  from public.shipments as shipment
  where shipment.tracking_number = normalized_tracking_number
  limit 1;

  if matched_shipment_id is null then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', chat_message.id,
        'sender_role', chat_message.sender_role,
        'body', chat_message.body,
        'created_at', chat_message.created_at
      )
      order by chat_message.created_at asc, chat_message.id asc
    ),
    '[]'::jsonb
  ) into message_payload
  from (
    select chat_message.*
    from public.shipment_chat_messages as chat_message
    where chat_message.shipment_id = matched_shipment_id
    order by chat_message.created_at desc, chat_message.id desc
    limit 200
  ) as chat_message;

  return jsonb_build_object('messages', message_payload);
end;
$$;

comment on function public.get_shipment_chat_messages(text) is
  'Returns up to the latest 200 chat messages for a shipment, oldest first. Never exposes sender_display_name or created_by - the caller renders admin rows as "LinxShip Support".';

revoke all on function public.get_shipment_chat_messages(text) from public;
revoke execute on function public.get_shipment_chat_messages(text) from anon, authenticated;
grant execute on function public.get_shipment_chat_messages(text) to service_role;

create function public.send_shipment_chat_message(
  p_tracking_number text,
  p_body text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  normalized_tracking_number text := upper(btrim(coalesce(p_tracking_number, '')));
  clean_body text := btrim(coalesce(p_body, ''));
  matched_shipment_id uuid;
  inserted_message public.shipment_chat_messages%rowtype;
begin
  if char_length(normalized_tracking_number) not between 4 and 64
     or normalized_tracking_number !~ '^[A-Z0-9][A-Z0-9-]{3,63}$' then
    return null;
  end if;

  if char_length(clean_body) not between 1 and 2000 then
    raise exception using
      errcode = '22023',
      message = 'Message must be between 1 and 2,000 characters.';
  end if;

  select shipment.id
    into matched_shipment_id
  from public.shipments as shipment
  where shipment.tracking_number = normalized_tracking_number
  limit 1;

  if matched_shipment_id is null then
    return null;
  end if;

  -- Serialize the check-and-insert window per tracking number so concurrent
  -- requests cannot bypass the short database-level flood-control cooldown.
  perform pg_advisory_xact_lock(hashtextextended(normalized_tracking_number, 0));

  if exists (
    select 1
    from public.shipment_chat_messages as chat_message
    where chat_message.shipment_id = matched_shipment_id
      and chat_message.sender_role = 'customer'
      and chat_message.created_at >= statement_timestamp() - interval '2 seconds'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Please wait a moment before sending another message.';
  end if;

  if (
    select count(*)
    from public.shipment_chat_messages as chat_message
    where chat_message.shipment_id = matched_shipment_id
  ) >= 500 then
    raise exception using
      errcode = 'P0001',
      message = 'This conversation has reached its message limit. Please contact us directly.';
  end if;

  insert into public.shipment_chat_messages (shipment_id, sender_role, body)
  values (matched_shipment_id, 'customer', clean_body)
  returning * into inserted_message;

  return jsonb_build_object(
    'id', inserted_message.id,
    'sender_role', inserted_message.sender_role,
    'body', inserted_message.body,
    'created_at', inserted_message.created_at
  );
end;
$$;

comment on function public.send_shipment_chat_message(text, text) is
  'Validates, rate-limits (2s cooldown per tracking number, 500 message cap per shipment), and stores a customer chat message without granting table INSERT.';

revoke all on function public.send_shipment_chat_message(text, text) from public;
revoke execute on function public.send_shipment_chat_message(text, text) from anon, authenticated;
grant execute on function public.send_shipment_chat_message(text, text) to service_role;

commit;
