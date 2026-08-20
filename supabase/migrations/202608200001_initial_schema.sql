-- Lion Gold Shipping / Linxship Supabase foundation
-- PostgreSQL 15+ / Supabase
--
-- Public visitors never receive table privileges. Tracking and contact submission
-- are deliberately exposed through narrow, validated SECURITY DEFINER functions.

begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_profiles_display_name_length
    check (char_length(btrim(display_name)) between 2 and 120)
);

comment on table public.admin_profiles is
  'Allow-list for Supabase Auth users who may administer shipments.';

create table public.shipment_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_terminal boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipment_statuses_name_length
    check (char_length(btrim(name)) between 2 and 64),
  constraint shipment_statuses_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint shipment_statuses_description_length
    check (description is null or char_length(description) <= 500)
);

create unique index shipment_statuses_name_ci_key
  on public.shipment_statuses (lower(name));
create index shipment_statuses_order_idx
  on public.shipment_statuses (sort_order, name);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null,

  sender_name text not null,
  sender_phone text,
  sender_address text not null,
  sender_email text,

  recipient_name text not null,
  recipient_phone text,
  recipient_address text not null,
  recipient_email text,

  payment_status text not null default 'unpaid',
  service_type text not null,
  office_of_origin text not null,
  destination text not null,
  currency text not null default 'USD',
  insurance numeric(14, 2) not null default 0,
  quantity integer not null default 1,
  weight numeric(14, 2) not null default 0,
  weight_unit text not null default 'kg',
  freight_price numeric(14, 2) not null default 0,
  package_value numeric(14, 2) not null default 0,
  package_description text not null,
  billing_status text not null default 'unpaid',
  collection_date date not null,
  delivery_date date,
  cargo_image_path text,
  shipment_details text,
  current_status text not null default 'Shipment created',
  is_delivered boolean not null default false,
  show_billing boolean not null default false,

  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shipments_tracking_number_format
    check (tracking_number ~ '^[A-Z0-9][A-Z0-9-]{3,63}$'),
  constraint shipments_sender_name_length
    check (char_length(btrim(sender_name)) between 2 and 160),
  constraint shipments_recipient_name_length
    check (char_length(btrim(recipient_name)) between 2 and 160),
  constraint shipments_sender_phone_length
    check (sender_phone is null or char_length(sender_phone) <= 40),
  constraint shipments_recipient_phone_length
    check (recipient_phone is null or char_length(recipient_phone) <= 40),
  constraint shipments_sender_address_length
    check (char_length(btrim(sender_address)) between 2 and 1000),
  constraint shipments_recipient_address_length
    check (char_length(btrim(recipient_address)) between 2 and 1000),
  constraint shipments_sender_email_format check (
    sender_email is null
    or (
      char_length(sender_email) <= 254
      and sender_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  ),
  constraint shipments_recipient_email_format check (
    recipient_email is null
    or (
      char_length(recipient_email) <= 254
      and recipient_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  ),
  constraint shipments_payment_status
    check (payment_status in ('paid', 'unpaid', 'partial', 'refunded')),
  constraint shipments_billing_status
    check (billing_status in ('paid', 'unpaid', 'partial', 'waived')),
  constraint shipments_service_type_length
    check (char_length(btrim(service_type)) between 2 and 100),
  constraint shipments_origin_length
    check (char_length(btrim(office_of_origin)) between 2 and 190),
  constraint shipments_destination_length
    check (char_length(btrim(destination)) between 2 and 190),
  constraint shipments_currency_format
    check (currency ~ '^[A-Z]{3}$'),
  constraint shipments_nonnegative_amounts
    check (
      insurance >= 0 and weight >= 0 and freight_price >= 0 and package_value >= 0
    ),
  constraint shipments_quantity_range
    check (quantity between 1 and 1000000),
  constraint shipments_weight_unit_length
    check (char_length(btrim(weight_unit)) between 1 and 16),
  constraint shipments_package_description_length
    check (char_length(btrim(package_description)) between 2 and 1000),
  constraint shipments_details_length
    check (shipment_details is null or char_length(shipment_details) <= 5000),
  constraint shipments_status_length
    check (char_length(btrim(current_status)) between 2 and 100),
  constraint shipments_delivery_after_collection
    check (delivery_date is null or delivery_date >= collection_date),
  constraint shipments_cargo_image_path check (
    cargo_image_path is null
    or (
      char_length(cargo_image_path) <= 512
      and cargo_image_path like id::text || '/%'
      and cargo_image_path ~* '\.(jpe?g|png|webp)$'
    )
  )
);

create unique index shipments_tracking_number_key
  on public.shipments (tracking_number);
create index shipments_created_at_idx
  on public.shipments (created_at desc);
create index shipments_current_status_idx
  on public.shipments (current_status);
create index shipments_sender_email_idx
  on public.shipments (lower(sender_email)) where sender_email is not null;
create index shipments_recipient_email_idx
  on public.shipments (lower(recipient_email)) where recipient_email is not null;

create table public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status text not null,
  location text not null,
  event_time timestamptz not null,
  requires_payment boolean not null default false,
  billing_amount numeric(14, 2) not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tracking_events_status_length
    check (char_length(btrim(status)) between 2 and 100),
  constraint tracking_events_location_length
    check (char_length(btrim(location)) between 2 and 190),
  constraint tracking_events_billing_amount
    check (
      billing_amount >= 0
      and (requires_payment or billing_amount = 0)
    )
);

create index tracking_events_timeline_idx
  on public.tracking_events (shipment_id, event_time desc, created_at desc, id desc);
create index tracking_events_status_idx
  on public.tracking_events (status);

create table public.shipment_messages (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  message text not null,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipment_messages_message_length
    check (char_length(btrim(message)) between 1 and 4000)
);

create index shipment_messages_timeline_idx
  on public.shipment_messages (shipment_id, created_at desc, id desc);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  read_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint contact_messages_name_length
    check (char_length(btrim(name)) between 2 and 80),
  constraint contact_messages_email_format check (
    char_length(email) <= 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint contact_messages_message_length
    check (char_length(btrim(message)) between 10 and 4000),
  constraint contact_messages_read_state check (
    (is_read and read_at is not null)
    or (not is_read and read_at is null and read_by is null)
  )
);

create index contact_messages_queue_idx
  on public.contact_messages (is_read, created_at desc);
create index contact_messages_email_recent_idx
  on public.contact_messages (lower(email), created_at desc);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_logs_action_format
    check (action ~ '^[a-z][a-z0-9_.-]{1,119}$'),
  constraint activity_logs_entity_type_format
    check (entity_type ~ '^[a-z][a-z0-9_.-]{1,79}$'),
  constraint activity_logs_details_object
    check (jsonb_typeof(details) = 'object')
);

create index activity_logs_actor_idx
  on public.activity_logs (actor_user_id, created_at desc);
create index activity_logs_entity_idx
  on public.activity_logs (entity_type, entity_id, created_at desc);
create index activity_logs_created_at_idx
  on public.activity_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Write preparation, status synchronization, and immutable audit trail
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

create function private.mask_person_name(p_name text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select string_agg(
    upper(left(name_part, 1))
      || repeat('*', least(7, greatest(2, char_length(name_part) - 1))),
    ' '
    order by part_number
  )
  from regexp_split_to_table(btrim(p_name), '[[:space:]]+')
    with ordinality as name_parts(name_part, part_number);
$$;

create function private.create_inactive_admin_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Administrator'
  );
begin
  if char_length(profile_name) < 2 then
    profile_name := 'Administrator';
  end if;

  insert into public.admin_profiles (user_id, display_name, is_active)
  values (new.id, left(profile_name, 120), false)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create function private.set_admin_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if acting_user is not null then
      new.created_by := acting_user;
      new.updated_by := acting_user;
    else
      new.updated_by := coalesce(new.updated_by, new.created_by);
    end if;
  else
    new.created_by := old.created_by;
    if acting_user is not null then
      new.updated_by := acting_user;
    end if;
  end if;
  return new;
end;
$$;

create function private.prepare_shipment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.tracking_number := upper(btrim(new.tracking_number));
  new.sender_name := btrim(new.sender_name);
  new.sender_phone := nullif(btrim(new.sender_phone), '');
  new.sender_address := btrim(new.sender_address);
  new.sender_email := lower(nullif(btrim(new.sender_email), ''));
  new.recipient_name := btrim(new.recipient_name);
  new.recipient_phone := nullif(btrim(new.recipient_phone), '');
  new.recipient_address := btrim(new.recipient_address);
  new.recipient_email := lower(nullif(btrim(new.recipient_email), ''));
  new.service_type := btrim(new.service_type);
  new.office_of_origin := btrim(new.office_of_origin);
  new.destination := btrim(new.destination);
  new.currency := upper(btrim(new.currency));
  new.weight_unit := lower(btrim(new.weight_unit));
  new.package_description := btrim(new.package_description);
  new.shipment_details := nullif(btrim(new.shipment_details), '');
  new.current_status := btrim(new.current_status);
  new.is_delivered := lower(new.current_status) = 'delivered';
  return new;
end;
$$;

create function private.prepare_tracking_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status := btrim(new.status);
  new.location := btrim(new.location);
  if not new.requires_payment then
    new.billing_amount := 0;
  end if;
  return new;
end;
$$;

create function private.prepare_contact_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  new.email := lower(btrim(new.email));
  new.message := btrim(new.message);

  if tg_op = 'INSERT' then
    new.is_read := false;
    new.read_at := null;
    new.read_by := null;
  elsif new.is_read and not old.is_read then
    new.read_at := statement_timestamp();
    new.read_by := auth.uid();
  elsif not new.is_read then
    new.read_at := null;
    new.read_by := null;
  elsif new.is_read then
    new.read_at := coalesce(old.read_at, statement_timestamp());
    new.read_by := coalesce(old.read_by, auth.uid());
  end if;

  return new;
end;
$$;

create function private.sync_shipment_status(p_shipment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_status text;
begin
  if p_shipment_id is null then
    return;
  end if;

  select tracking_event.status
    into latest_status
  from public.tracking_events as tracking_event
  where tracking_event.shipment_id = p_shipment_id
  order by tracking_event.event_time desc,
           tracking_event.created_at desc,
           tracking_event.id desc
  limit 1;

  update public.shipments
  set current_status = coalesce(latest_status, 'Shipment created'),
      is_delivered = lower(coalesce(latest_status, 'Shipment created')) = 'delivered'
  where id = p_shipment_id
    and (
      current_status is distinct from coalesce(latest_status, 'Shipment created')
      or is_delivered is distinct from
        (lower(coalesce(latest_status, 'Shipment created')) = 'delivered')
    );
end;
$$;

create function private.sync_shipment_status_from_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.sync_shipment_status(old.shipment_id);
  elsif tg_op = 'UPDATE' then
    if old.shipment_id is distinct from new.shipment_id then
      perform private.sync_shipment_status(old.shipment_id);
    end if;
    perform private.sync_shipment_status(new.shipment_id);
  else
    perform private.sync_shipment_status(new.shipment_id);
  end if;
  return null;
end;
$$;

create function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  new_row jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  changed_fields jsonb;
  record_id uuid;
begin
  select coalesce(jsonb_agg(key_name order by key_name), '[]'::jsonb)
    into changed_fields
  from (
    select key_name
    from (
      select jsonb_object_keys(old_row || new_row) as key_name
    ) as keys
    where key_name not in ('created_at', 'updated_at')
      and old_row -> key_name is distinct from new_row -> key_name
  ) as changed;

  record_id := nullif(
    coalesce(
      new_row ->> 'id',
      old_row ->> 'id',
      new_row ->> 'user_id',
      old_row ->> 'user_id'
    ),
    ''
  )::uuid;

  insert into public.activity_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    record_id,
    jsonb_build_object('changed_fields', changed_fields)
  );

  return null;
end;
$$;

create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function private.set_updated_at();

create trigger on_auth_user_created_create_inactive_admin_profile
after insert on auth.users
for each row execute function private.create_inactive_admin_profile();

create trigger shipment_statuses_set_actor
before insert or update on public.shipment_statuses
for each row execute function private.set_admin_actor();
create trigger shipment_statuses_set_updated_at
before update on public.shipment_statuses
for each row execute function private.set_updated_at();

create trigger shipments_prepare
before insert or update on public.shipments
for each row execute function private.prepare_shipment();
create trigger shipments_set_actor
before insert or update on public.shipments
for each row execute function private.set_admin_actor();
create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function private.set_updated_at();

create trigger tracking_events_prepare
before insert or update on public.tracking_events
for each row execute function private.prepare_tracking_event();
create trigger tracking_events_set_actor
before insert or update on public.tracking_events
for each row execute function private.set_admin_actor();
create trigger tracking_events_set_updated_at
before update on public.tracking_events
for each row execute function private.set_updated_at();
create trigger tracking_events_sync_shipment
after insert or update or delete on public.tracking_events
for each row execute function private.sync_shipment_status_from_event();

create trigger shipment_messages_set_actor
before insert or update on public.shipment_messages
for each row execute function private.set_admin_actor();
create trigger shipment_messages_set_updated_at
before update on public.shipment_messages
for each row execute function private.set_updated_at();

create trigger contact_messages_prepare
before insert or update on public.contact_messages
for each row execute function private.prepare_contact_message();

create trigger audit_admin_profiles
after insert or update or delete on public.admin_profiles
for each row execute function private.audit_row_change();
create trigger audit_shipment_statuses
after insert or update or delete on public.shipment_statuses
for each row execute function private.audit_row_change();
create trigger audit_shipments
after insert or update or delete on public.shipments
for each row execute function private.audit_row_change();
create trigger audit_tracking_events
after insert or update or delete on public.tracking_events
for each row execute function private.audit_row_change();
create trigger audit_shipment_messages
after insert or update or delete on public.shipment_messages
for each row execute function private.audit_row_change();
create trigger audit_contact_messages
after insert or update or delete on public.contact_messages
for each row execute function private.audit_row_change();

-- ---------------------------------------------------------------------------
-- Admin authorization and row-level security
-- ---------------------------------------------------------------------------

create function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and is_active
  );
$$;

comment on function public.is_active_admin() is
  'True only for the signed-in Supabase Auth user with an active admin profile.';

revoke all on function public.is_active_admin() from public, anon;
grant execute on function public.is_active_admin() to authenticated;

alter table public.admin_profiles enable row level security;
alter table public.shipment_statuses enable row level security;
alter table public.shipments enable row level security;
alter table public.tracking_events enable row level security;
alter table public.shipment_messages enable row level security;
alter table public.contact_messages enable row level security;
alter table public.activity_logs enable row level security;

create policy admin_profiles_select
on public.admin_profiles for select to authenticated
using (user_id = auth.uid() or public.is_active_admin());
create policy admin_profiles_insert
on public.admin_profiles for insert to authenticated
with check (public.is_active_admin());
create policy admin_profiles_update
on public.admin_profiles for update to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());
create policy admin_profiles_delete
on public.admin_profiles for delete to authenticated
using (public.is_active_admin());

create policy shipment_statuses_admin_all
on public.shipment_statuses for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());
create policy shipments_admin_all
on public.shipments for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());
create policy tracking_events_admin_all
on public.tracking_events for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());
create policy shipment_messages_admin_all
on public.shipment_messages for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());
create policy contact_messages_admin_all
on public.contact_messages for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());
create policy activity_logs_admin_read
on public.activity_logs for select to authenticated
using (public.is_active_admin());

revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update, delete on public.admin_profiles to authenticated;
grant select, insert, update, delete on public.shipment_statuses to authenticated;
grant select, insert, update, delete on public.shipments to authenticated;
grant select, insert, update, delete on public.tracking_events to authenticated;
grant select, insert, update, delete on public.shipment_messages to authenticated;
grant select, insert, update, delete on public.contact_messages to authenticated;
grant select on public.activity_logs to authenticated;

-- ---------------------------------------------------------------------------
-- Hardened public RPCs
-- ---------------------------------------------------------------------------

create function public.track_shipment(p_tracking_number text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_tracking_number text := upper(btrim(coalesce(p_tracking_number, '')));
  tracked_shipment public.shipments%rowtype;
  event_payload jsonb;
  message_payload jsonb;
begin
  if char_length(normalized_tracking_number) not between 4 and 64
     or normalized_tracking_number !~ '^[A-Z0-9][A-Z0-9-]{3,63}$' then
    return null;
  end if;

  select shipment.*
    into tracked_shipment
  from public.shipments as shipment
  where shipment.tracking_number = normalized_tracking_number
  limit 1;

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', event.id,
        'status', event.status,
        'location', event.location,
        'event_time', event.event_time,
        'requires_payment', event.requires_payment,
        'billing_amount', case
          when tracked_shipment.show_billing then event.billing_amount
          else null
        end,
        'created_at', event.created_at
      )
      order by event.event_time desc, event.created_at desc, event.id desc
    ),
    '[]'::jsonb
  ) into event_payload
  from (
    select tracking_event.*
    from public.tracking_events as tracking_event
    where tracking_event.shipment_id = tracked_shipment.id
    order by tracking_event.event_time desc,
             tracking_event.created_at desc,
             tracking_event.id desc
    limit 250
  ) as event;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', shipment_message.id,
        'message', shipment_message.message,
        'created_at', shipment_message.created_at
      )
      order by shipment_message.created_at desc, shipment_message.id desc
    ),
    '[]'::jsonb
  ) into message_payload
  from (
    select message.*
    from public.shipment_messages as message
    where message.shipment_id = tracked_shipment.id
    order by message.created_at desc, message.id desc
    limit 100
  ) as shipment_message;

  return jsonb_build_object(
    'shipment', jsonb_build_object(
      'tracking_number', tracked_shipment.tracking_number,
      'sender_name', private.mask_person_name(tracked_shipment.sender_name),
      'sender_phone', null,
      'sender_address', null,
      'sender_email', null,
      'recipient_name', private.mask_person_name(tracked_shipment.recipient_name),
      'recipient_phone', null,
      'recipient_address', null,
      'recipient_email', null,
      'payment_status', case
        when tracked_shipment.show_billing then tracked_shipment.payment_status
        else null
      end,
      'service_type', tracked_shipment.service_type,
      'office_of_origin', tracked_shipment.office_of_origin,
      'destination', tracked_shipment.destination,
      'currency', tracked_shipment.currency,
      'insurance', case
        when tracked_shipment.show_billing then tracked_shipment.insurance
        else null
      end,
      'quantity', tracked_shipment.quantity,
      'weight', tracked_shipment.weight,
      'weight_unit', tracked_shipment.weight_unit,
      'freight_price', case
        when tracked_shipment.show_billing then tracked_shipment.freight_price
        else null
      end,
      'package_value', case
        when tracked_shipment.show_billing then tracked_shipment.package_value
        else null
      end,
      'package_description', tracked_shipment.package_description,
      'billing_status', case
        when tracked_shipment.show_billing then tracked_shipment.billing_status
        else null
      end,
      'collection_date', tracked_shipment.collection_date,
      'delivery_date', tracked_shipment.delivery_date,
      'current_status', tracked_shipment.current_status,
      'is_delivered', tracked_shipment.is_delivered,
      'show_billing', tracked_shipment.show_billing,
      -- The path alone cannot read the private bucket. A trusted Next.js server
      -- may exchange it for a short-lived signed URL after this bearer lookup.
      'cargo_image_path', tracked_shipment.cargo_image_path,
      'has_cargo_image', tracked_shipment.cargo_image_path is not null,
      'created_at', tracked_shipment.created_at,
      'updated_at', tracked_shipment.updated_at
    ),
    'events', event_payload,
    'messages', message_payload
  );
end;
$$;

comment on function public.track_shipment(text) is
  'Returns one deliberately curated shipment timeline for an exact bearer tracking number.';

revoke all on function public.track_shipment(text) from public;
revoke execute on function public.track_shipment(text) from anon, authenticated;
grant execute on function public.track_shipment(text) to service_role;

create function public.submit_contact_message(
  p_name text,
  p_email text,
  p_message text,
  p_website text default ''
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  clean_name text := btrim(coalesce(p_name, ''));
  clean_email text := lower(btrim(coalesce(p_email, '')));
  clean_message text := btrim(coalesce(p_message, ''));
  inserted_id uuid;
begin
  -- Honeypot submissions receive a plausible success value without being stored.
  if btrim(coalesce(p_website, '')) <> '' then
    return gen_random_uuid();
  end if;

  if char_length(clean_name) not between 2 and 80 then
    raise exception using
      errcode = '22023',
      message = 'Name must be between 2 and 80 characters.';
  end if;

  if char_length(clean_email) > 254
     or clean_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using
      errcode = '22023',
      message = 'A valid email address is required.';
  end if;

  if char_length(clean_message) not between 10 and 4000 then
    raise exception using
      errcode = '22023',
      message = 'Message must be between 10 and 4000 characters.';
  end if;

  -- Serialize the check-and-insert window for this email address so concurrent
  -- requests cannot bypass the short database-level cooldown.
  perform pg_advisory_xact_lock(hashtextextended(clean_email, 0));

  -- Database-level burst protection. Edge/server rate limiting can add IP-level
  -- protection without widening this function's access to request metadata.
  if exists (
    select 1
    from public.contact_messages
    where lower(email) = clean_email
      and created_at >= statement_timestamp() - interval '30 seconds'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Please wait before sending another message.';
  end if;

  insert into public.contact_messages (name, email, message)
  values (clean_name, clean_email, clean_message)
  returning id into inserted_id;

  return inserted_id;
end;
$$;

comment on function public.submit_contact_message(text, text, text, text) is
  'Validates and stores a public contact request without granting table INSERT.';

revoke all on function public.submit_contact_message(text, text, text, text) from public;
revoke execute on function public.submit_contact_message(text, text, text, text)
  from anon, authenticated;
grant execute on function public.submit_contact_message(text, text, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- Private shipment image bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'shipment-images',
  'shipment-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy shipment_images_admin_select
on storage.objects for select to authenticated
using (
  bucket_id = 'shipment-images'
  and public.is_active_admin()
);

create policy shipment_images_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'shipment-images'
  and public.is_active_admin()
  and name ~* '^[0-9a-f-]{36}/[a-z0-9][a-z0-9._-]{0,127}\.(jpe?g|png|webp)$'
  and exists (
    select 1
    from public.shipments
    where id::text = split_part(name, '/', 1)
  )
);

create policy shipment_images_admin_update
on storage.objects for update to authenticated
using (
  bucket_id = 'shipment-images'
  and public.is_active_admin()
)
with check (
  bucket_id = 'shipment-images'
  and public.is_active_admin()
  and name ~* '^[0-9a-f-]{36}/[a-z0-9][a-z0-9._-]{0,127}\.(jpe?g|png|webp)$'
  and exists (
    select 1
    from public.shipments
    where id::text = split_part(name, '/', 1)
  )
);

create policy shipment_images_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'shipment-images'
  and public.is_active_admin()
);

-- ---------------------------------------------------------------------------
-- Seed status catalog
-- ---------------------------------------------------------------------------

insert into public.shipment_statuses (
  name,
  slug,
  description,
  sort_order,
  is_terminal
) values
  ('Shipment created', 'shipment-created', 'Shipment information has been received.', 10, false),
  ('Pending', 'pending', 'Shipment is awaiting its next processing step.', 20, false),
  ('Picked up', 'picked-up', 'Shipment has been collected from the sender.', 30, false),
  ('In Transit', 'in-transit', 'Shipment is moving through the carrier network.', 40, false),
  ('Customs clearance', 'customs-clearance', 'Shipment is being processed by customs.', 50, false),
  ('On Hold', 'on-hold', 'Shipment is temporarily held.', 60, false),
  ('Out for Delivery', 'out-for-delivery', 'Shipment is with the final-mile courier.', 70, false),
  ('Delivered', 'delivered', 'Shipment has reached its recipient.', 80, true),
  ('Cancelled', 'cancelled', 'Shipment was cancelled.', 90, true)
on conflict (slug) do nothing;

-- Trigger helpers are intentionally inaccessible as ad-hoc RPCs.
revoke all on all functions in schema private from public, anon, authenticated;

commit;
