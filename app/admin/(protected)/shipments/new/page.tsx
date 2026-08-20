import Link from "next/link";
import { ShipmentForm } from "@/components/admin/shipment-form";
import { PageHeader } from "@/components/admin/server-ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Create shipment" };

function trackingNumber() {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const random = crypto.randomUUID().replaceAll("-", "").toUpperCase();
  return `LGS-${date}-${random}`;
}

export default async function NewShipmentPage() {
  const supabase = await createClient();
  const { data: statuses } = await supabase
    .from("shipment_statuses")
    .select("id,name")
    .order("sort_order")
    .order("name");
  return (
    <>
      <PageHeader eyebrow="New consignment" title="Create shipment" description="Add routing, customer, package, and commercial information.">
        <Link href="/admin/shipments" className="admin-button admin-button--secondary">Back to shipments</Link>
      </PageHeader>
      <ShipmentForm
        mode="create"
        statuses={statuses ?? []}
        initial={{
          tracking_number: trackingNumber(),
          quantity: 1,
          weight: 0,
          weight_unit: "kg",
          insurance: 0,
          freight_price: 0,
          package_value: 0,
          currency: "USD",
          payment_status: "unpaid",
          billing_status: "unpaid",
          current_status: statuses?.[0]?.name || "Pending",
          show_billing: false,
          is_delivered: false,
          collection_date: new Date().toISOString().slice(0, 10),
        }}
      />
    </>
  );
}
