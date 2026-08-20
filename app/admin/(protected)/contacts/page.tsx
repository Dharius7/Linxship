import { AdminIcon } from "@/components/admin/icons";
import { formatDate } from "@/components/admin/format";
import { ConfirmButton } from "@/components/admin/ui";
import { EmptyState, Notice, PageHeader, Pagination } from "@/components/admin/server-ui";
import { deleteContactAction, markContactReadAction, markContactUnreadAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Contact inbox" };
const PAGE_SIZE = 24;
type Search = { page?: string | string[]; success?: string | string[]; error?: string | string[] };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function ContactInboxPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const page = Math.max(1, Number.parseInt(one(search.page) || "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const supabase = await createClient();
  const { data: messages, count, error } = await supabase
    .from("contact_messages")
    .select("id,name,email,message,is_read,created_at", { count: "exact" })
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <>
      <PageHeader eyebrow="Customer communications" title="Contact inbox" description={`${total} message${total === 1 ? "" : "s"} submitted through the public website.`} />
      <Notice success={one(search.success)} error={one(search.error) || (error ? "Messages could not be loaded." : undefined)} />
      <section className="admin-panel admin-panel--flush">
        <div className="admin-panel-heading admin-panel-heading--padded"><div><span className="admin-eyebrow">Newest first</span><h2>Customer enquiries</h2></div><span className="admin-count-pill">{messages?.filter((item) => !item.is_read).length ?? 0} new</span></div>
        {!messages?.length ? (
          <EmptyState icon="inbox" title="The inbox is clear" description="New contact form submissions will appear here." />
        ) : (
          <div className="admin-contact-list">
            {messages.map((message) => (
              <article key={message.id} className={message.is_read ? "" : "is-unread"}>
                <span className="admin-contact-avatar">{message.name.slice(0, 1).toUpperCase()}</span>
                <div className="admin-contact-copy">
                  <div><h2>{message.name}</h2>{!message.is_read && <span>New</span>}<time>{formatDate(message.created_at, true)}</time></div>
                  <a href={`mailto:${message.email}`}>{message.email}</a>
                  <p>{message.message}</p>
                </div>
                <div className="admin-contact-actions">
                  <a href={`mailto:${message.email}`} className="admin-button admin-button--small"><AdminIcon name="message" />Reply</a>
                  <form action={(message.is_read ? markContactUnreadAction : markContactReadAction).bind(null, message.id)}><button className="admin-button admin-button--secondary admin-button--small" type="submit">Mark {message.is_read ? "unread" : "read"}</button></form>
                  <form action={deleteContactAction.bind(null, message.id)}><ConfirmButton message="Permanently delete this contact message?">Delete</ConfirmButton></form>
                </div>
              </article>
            ))}
          </div>
        )}
        <Pagination page={Math.min(page, pages)} pages={pages} href={(next) => `/admin/contacts?page=${next}`} />
      </section>
    </>
  );
}

