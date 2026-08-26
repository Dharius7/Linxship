"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [seenCount, setSeenCount] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const openRef = useRef(open);

  const endpoint = `/api/track/${encodeURIComponent(trackingNumber)}/chat`;

  useEffect(() => {
    openRef.current = open;
  }, [open]);

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
        // While the widget is open, every message that arrives is
        // immediately visible, so keep the "seen" mark advancing with it.
        if (openRef.current) setSeenCount(data.messages.length);
      } else {
        setLoadFailed(true);
      }
    } catch {
      setLoadFailed(true);
    }
  }, [endpoint]);

  function toggleOpen() {
    setOpen((value) => {
      const next = !value;
      if (next) setSeenCount(messages?.length ?? 0);
      return next;
    });
  }

  useEffect(() => {
    // Fetch-on-mount + interval polling syncs the thread with the server
    // (an external system), which is exactly what effects are for. Keeps
    // running while the widget is closed so the unread badge stays live.
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
    if (!open || !threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [open, messages]);

  const unreadCount = !open && messages ? messages.slice(seenCount).filter((message) => message.sender_role === "admin").length : 0;

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
      textareaRef.current?.focus();
    } catch {
      setError("Message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="track-chat-widget">
      {open && (
        <div className="track-chat-panel" role="dialog" aria-label="Chat with our team">
          <header className="track-chat-panel__header">
            <span><MessageCircle aria-hidden="true" size={17} /> Chat with our team</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat"><X aria-hidden="true" size={18} /></button>
          </header>

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
                ref={textareaRef}
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
              <button
                type="submit"
                onMouseDown={(event) => event.preventDefault()}
                disabled={isSending || !draft.trim() || (messages === null && loadFailed)}
                aria-label="Send message"
              >
                <Send aria-hidden="true" size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      <button type="button" className="track-chat-widget__toggle" onClick={toggleOpen} aria-label={open ? "Close chat" : "Chat with our team"}>
        {open ? <X aria-hidden="true" size={24} /> : <MessageCircle aria-hidden="true" size={24} />}
        {unreadCount > 0 && <span className="track-chat-widget__badge">{unreadCount}</span>}
      </button>
    </div>
  );
}
