-- Show sender and recipient names and addresses on the public tracking payload.
create or replace function public.track_shipment(p_tracking_number text)
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
      'sender_name', tracked_shipment.sender_name,
      'sender_phone', null,
      'sender_address', tracked_shipment.sender_address,
      'sender_email', null,
      'recipient_name', tracked_shipment.recipient_name,
      'recipient_phone', null,
      'recipient_address', tracked_shipment.recipient_address,
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
  'Returns one curated shipment timeline, including sender and recipient name and address.';
