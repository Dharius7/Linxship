import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatThread } from "@/components/admin/chat-thread";
import { PageHeader } from "@/components/admin/server-ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Live chat" };

export default async function ShipmentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: shipment }, { data: messages }, { data: userResult }] = await Promise.all([
    supabase.from("shipments").select("tracking_number,recipient_name").eq("id", id).maybeSingle(),
    supabase
      .from("shipment_chat_messages")
      .select("id,sender_role,body,created_by,sender_display_name,is_read_by_admin,created_at")
      .eq("shipment_id", id)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase.auth.getUser(),
  ]);
  if (!shipment) notFound();

  return (
    <>
      <PageHeader
        eyebrow={shipment.tracking_number}
        title="Live chat"
        description={`Chat directly with ${shipment.recipient_name} about this shipment.`}
      >
        <Link href={`/admin/shipments/${id}`} className="admin-button admin-button--secondary">Back to shipment</Link>
      </PageHeader>
      <ChatThread
        shipmentId={id}
        recipientName={shipment.recipient_name}
        currentUserId={userResult.user?.id ?? ""}
        initialMessages={messages ?? []}
      />
    </>
  );
}
