import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageForm } from "@/components/admin/message-form";
import { PageHeader } from "@/components/admin/server-ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit shipment message" };

export default async function EditMessagePage({ params }: { params: Promise<{ id: string; messageId: string }> }) {
  const { id, messageId } = await params;
  const supabase = await createClient();
  const [{ data: shipment }, { data: message }] = await Promise.all([
    supabase.from("shipments").select("tracking_number").eq("id", id).maybeSingle(),
    supabase.from("shipment_messages").select("id,message").eq("id", messageId).eq("shipment_id", id).maybeSingle(),
  ]);
  if (!shipment || !message) notFound();
  return (
    <>
      <PageHeader eyebrow={shipment.tracking_number} title="Edit customer message" description="Changes appear on the public tracking result immediately.">
        <Link href={`/admin/shipments/${id}/messages`} className="admin-button admin-button--secondary">Back to messages</Link>
      </PageHeader>
      <section className="admin-panel admin-form-section admin-narrow-panel"><MessageForm shipmentId={id} message={message} /></section>
    </>
  );
}

