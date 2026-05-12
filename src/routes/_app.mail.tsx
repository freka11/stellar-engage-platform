import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Inbox, Send as SendIcon, FileText, Plus, Search, Paperclip, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/mail")({ component: Mail });

type Folder = "inbox" | "sent" | "drafts";
type MailItem = { id: string; from: string; subject: string; preview: string; time: string; unread?: boolean; starred?: boolean; attachments?: number };

const data: Record<Folder, MailItem[]> = {
  inbox: [
    { id: "1", from: "Dr. Aisha Khan", subject: "MRI Report — Patient #2941", preview: "Please find attached the latest MRI report and findings…", time: "10:24", unread: true, attachments: 2 },
    { id: "2", from: "HR · Crescent", subject: "Annual HIPAA training due", preview: "Your annual HIPAA refresh is due in 5 days. Please complete…", time: "09:02", unread: true },
    { id: "3", from: "Pharmacy", subject: "Updated medication protocol v3.2", preview: "New protocol effective Monday. See attached PDF…", time: "Yesterday", attachments: 1 },
    { id: "4", from: "Dr. Marco Silva", subject: "Re: Cardio rounds", preview: "Sounds good — see you at 9 sharp.", time: "Yesterday" },
    { id: "5", from: "IT Security", subject: "Unusual sign-in detected", preview: "We noticed a new sign-in from Chrome on macOS…", time: "Mon" },
  ],
  sent: [
    { id: "s1", from: "Me", subject: "Re: MRI Report — Patient #2941", preview: "Thanks Aisha, I'll review and get back today.", time: "10:31" },
  ],
  drafts: [
    { id: "d1", from: "Me", subject: "(no subject)", preview: "Hi team, just a quick note about…", time: "Now" },
  ],
};

function Mail() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [open, setOpen] = useState<MailItem | null>(null);
  const [compose, setCompose] = useState(false);
  const [q, setQ] = useState("");

  const list = data[folder].filter((m) => (m.subject + m.from + m.preview).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_360px_1fr] gap-4 h-[calc(100vh-9rem)]">
      <aside className="glass rounded-2xl p-3 space-y-1">
        <button onClick={() => setCompose(true)} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2.5 font-semibold shadow-glow hover:opacity-90 transition">
          <Plus className="size-4" /> Compose
        </button>
        {([
          { k: "inbox" as const, l: "Inbox", Icon: Inbox, n: data.inbox.filter(m => m.unread).length },
          { k: "sent" as const, l: "Sent", Icon: SendIcon, n: 0 },
          { k: "drafts" as const, l: "Drafts", Icon: FileText, n: data.drafts.length },
        ]).map(({ k, l, Icon, n }) => (
          <button key={k} onClick={() => { setFolder(k); setOpen(null); }} className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${folder === k ? "bg-accent text-foreground" : "hover:bg-accent/60 text-muted-foreground"}`}>
            <span className="flex items-center gap-3"><Icon className="size-4" /> {l}</span>
            {n > 0 && <span className="text-[10px] bg-gradient-primary text-primary-foreground rounded-full px-1.5 py-0.5">{n}</span>}
          </button>
        ))}
      </aside>

      <section className="glass rounded-2xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mail" className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.map((m) => (
            <button key={m.id} onClick={() => setOpen(m)} className={`w-full text-left p-4 border-b border-border/60 hover:bg-accent/40 transition ${open?.id === m.id ? "bg-accent/60" : ""}`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${m.unread ? "font-semibold" : "font-medium"} truncate`}>{m.from}</div>
                <div className="text-[11px] text-muted-foreground">{m.time}</div>
              </div>
              <div className={`text-sm truncate ${m.unread ? "font-medium" : "text-muted-foreground"}`}>{m.subject}</div>
              <div className="text-xs text-muted-foreground truncate">{m.preview}</div>
              <div className="flex items-center gap-2 mt-1">
                {m.attachments && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Paperclip className="size-3" /> {m.attachments}</span>}
                {m.unread && <span className="size-1.5 rounded-full bg-primary" />}
              </div>
            </button>
          ))}
          {list.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No messages</div>}
        </div>
      </section>

      <section className="glass rounded-2xl p-6 overflow-y-auto">
        {open ? (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{open.subject}</h2>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-accent"><Star className="size-4" /></button>
                <button className="p-2 rounded-lg hover:bg-accent text-destructive"><Trash2 className="size-4" /></button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">{open.from.split(" ").map(s => s[0]).slice(0,2).join("")}</div>
              <div><div className="text-sm font-medium">{open.from}</div><div className="text-xs text-muted-foreground">to me · {open.time}</div></div>
            </div>
            <div className="mt-6 text-sm leading-relaxed text-foreground/90 space-y-3">
              <p>{open.preview}</p>
              <p>Let me know if you have any questions or need additional context. I've included the supporting documents for your review.</p>
              <p>Best,<br />{open.from}</p>
            </div>
            {open.attachments && (
              <div className="mt-6 grid grid-cols-2 gap-2">
                {Array.from({ length: open.attachments }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="size-10 rounded-lg bg-accent flex items-center justify-center"><FileText className="size-5 text-primary" /></div>
                    <div className="text-sm"><div className="font-medium">Report-{i + 1}.pdf</div><div className="text-xs text-muted-foreground">2.4 MB</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Select a message to read</div>
        )}
      </section>

      {compose && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-foreground/30 backdrop-blur-sm" onClick={() => setCompose(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full md:max-w-2xl bg-card rounded-t-2xl md:rounded-2xl shadow-elegant border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="font-semibold">New message</div>
              <button onClick={() => setCompose(false)} className="p-1.5 rounded-lg hover:bg-accent"><X className="size-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); toast.success("Message sent (demo)"); setCompose(false); }} className="p-4 space-y-3">
              <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30" placeholder="To" />
              <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30" placeholder="Subject" />
              <textarea rows={8} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30" placeholder="Write your message…" />
              <div className="flex items-center justify-between pt-1">
                <button type="button" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Paperclip className="size-4" /> Attach</button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow"><SendIcon className="size-4" /> Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
