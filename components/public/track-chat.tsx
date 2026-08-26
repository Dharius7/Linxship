"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

type ChatMessage = {
  id: string;
  sender_role: "customer" | "admin";
  body: string;
  created_at: string;
};

const POLL_INTERVAL_MS = 5000;

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function TrackChat({ trackingNumber }: { trackingNumber: string }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const endpoint = `/api/track/${encodeURIComponent(trackingNumber)}/chat`;

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) {
        setLoadFailed(true);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data?.messages)) {
        setMessages(data.messages);
        setLoadFailed(false);
      } else {
        setLoadFailed(true);
      }
    } catch {
      setLoadFailed(true);
    }
  }, [endpoint]);

  useEffect(() => {
    // Fetch-on-mount + interval polling syncs the thread with the server
    // (an external system), which is exactly what effects are for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [load]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.message || "Message could not be sent. Please try again.");
        return;
      }
      setDraft("");
      await load();
    } catch {
      setError("Message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="track-chat">
      <div className="track-chat-thread" ref={threadRef} aria-live="polite">
        {messages === null && loadFailed ? (
          <p className="track-chat-empty">Chat is temporarily unavailable. Please try again shortly.</p>
        ) : messages === null ? (
          <p className="track-chat-empty">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="track-chat-empty"><MessageCircle aria-hidden="true" size={18} /> Send a message and our team will reply here.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={`track-chat-bubble ${message.sender_role === "admin" ? "is-support" : "is-mine"}`}>
              <span className="track-chat-bubble__meta">
                {message.sender_role === "admin" ? "LinxShip Support" : "You"} · <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
              </span>
              <p>{message.body}</p>
            </article>
          ))
        )}
      </div>

      <form className="track-chat-form" onSubmit={handleSubmit}>
        {error && <p className="track-chat-error">{error}</p>}
        <div className="track-chat-form__row">
          <label htmlFor="chat-message" className="sr-only">Message</label>
          <textarea
            id="chat-message"
            name="body"
            rows={2}
            maxLength={2000}
            placeholder={messages === null && loadFailed ? "Chat is temporarily unavailable…" : "Type a message…"}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={messages === null && loadFailed}
            required
          />
          <button type="submit" disabled={isSending || !draft.trim() || (messages === null && loadFailed)} aria-label="Send message">
            <Send aria-hidden="true" size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
