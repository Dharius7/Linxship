"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { markShipmentChatReadAction, sendAdminChatMessageAction, type AdminActionState } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/browser";
import { formatDate } from "./format";
import { ActionAlert, SubmitButton } from "./ui";

type ChatRow = {
  id: string;
  sender_role: string;
  body: string;
  created_by: string | null;
  sender_display_name: string | null;
  is_read_by_admin: boolean;
  created_at: string;
};

const initialState: AdminActionState = { status: "idle", message: "" };
const POLL_INTERVAL_MS = 4000;

export function ChatThread({
  shipmentId,
  recipientName,
  currentUserId,
  initialMessages,
}: {
  shipmentId: string;
  recipientName: string;
  currentUserId: string;
  initialMessages: ChatRow[];
}) {
  const [messages, setMessages] = useState<ChatRow[]>(initialMessages);
  const threadRef = useRef<HTMLDivElement>(null);
  const [state, action] = useActionState(sendAdminChatMessageAction.bind(null, shipmentId), initialState);

  async function poll() {
    const supabase = createClient();
    const { data } = await supabase
      .from("shipment_chat_messages")
      .select("id,sender_role,body,created_by,sender_display_name,is_read_by_admin,created_at")
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (!data) return;
    const hasUnread = data.some((row) => row.sender_role === "customer" && !row.is_read_by_admin);
    setMessages(
      hasUnread
        ? data.map((row) => (row.sender_role === "customer" ? { ...row, is_read_by_admin: true } : row))
        : data,
    );
    if (hasUnread) void markShipmentChatReadAction(shipmentId);
  }

  useEffect(() => {
    // Fetch-on-mount + interval polling syncs this thread with the database
    // (an external system), which is exactly what effects are for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();
    const interval = setInterval(() => {
      if (!document.hidden) poll();
    }, POLL_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.status === "success") poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  function senderLabel(row: ChatRow) {
    if (row.sender_role === "customer") return recipientName;
    if (row.created_by === currentUserId) return "You";
    return row.sender_display_name || "Support agent";
  }

  return (
    <section className="admin-panel admin-chat-panel">
      <div className="admin-chat-thread" ref={threadRef}>
        {messages.length === 0 ? (
          <div className="admin-inline-empty">No chat messages yet.</div>
        ) : (
          messages.map((row) => (
            <article key={row.id} className={`admin-chat-bubble ${row.sender_role === "admin" ? "is-admin" : "is-customer"}`}>
              <span className="admin-chat-bubble__meta">{senderLabel(row)} · {formatDate(row.created_at, true)}</span>
              <p>{row.body}</p>
            </article>
          ))
        )}
      </div>

      <form action={action} className="admin-chat-form">
        <ActionAlert state={state} />
        <div className="admin-field">
          <label htmlFor="body">Reply</label>
          <textarea id="body" name="body" rows={3} maxLength={2000} placeholder="Type a reply…" required />
        </div>
        <div><SubmitButton pendingLabel="Sending…">Send reply</SubmitButton></div>
      </form>
    </section>
  );
}
