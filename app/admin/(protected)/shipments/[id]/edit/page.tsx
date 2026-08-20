import Link from "next/link";
import { notFound } from "next/navigation";
import { ShipmentForm } from "@/components/admin/shipment-form";
import { formatDate } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/server-ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit shipment" };

export default async function EditShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: shipment }, { data: statuses }] = await Promise.all([
    supabase.from("shipments").select("*").eq("id", id).maybeSingle(),
    supabase.from("shipment_statuses").select("id,name").order("sort_order").order("name"),
  ]);
  if (!shipment) notFound();
  return (
    <>
      <PageHeader eyebrow="Edit consignment" title={shipment.tracking_number} description={`Last updated ${formatDate(shipment.updated_at, true)}`}>
        <Link href={`/admin/shipments/${id}`} className="admin-button admin-button--secondary">Cancel</Link>
      </PageHeader>
      <ShipmentForm mode="edit" shipmentId={id} statuses={statuses ?? []} initial={shipment} />
    </>
  );
}

