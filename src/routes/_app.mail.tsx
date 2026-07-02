import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Inbox, Send as SendIcon, Plus, Search, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Folder = "inbox" | "sent";
type Profile = { id: string; full_name: string; department: string | null };
type MailRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
  sender?: Profile | null;
  recipient?: Profile | null;
};

export const Route = createFileRoute("/_app/mail")({
  component: MailPage,
  validateSearch: (s: Record<string, unknown>) => ({ to: typeof s.to === "string" ? s.to : undefined }),
});

function MailPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_app/mail" });
  const [folder, setFolder] = useState<Folder>("inbox");
  const [items, setItems] = useState<MailRow[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [open, setOpen] = useState<MailRow | null>(null);
  const [compose, setCompose] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (search.to) {
      setComposeTo(search.to);
      setCompose(true);
    }
  }, [search.to]);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, department").order("full_name").then(({ data }) => {
      setPeople((data ?? []) as Profile[]);
    });
  }, []);

  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const col = folder === "inbox" ? "recipient_id" : "sender_id";
    const { data, error } = await supabase
      .from("mails")
      .select("*")
      .eq(col, user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as MailRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [folder, user?.id]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("mails-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "mails" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, folder]);

  async function openMail(m: MailRow) {
    setOpen(m);
    if (folder === "inbox" && !m.read && user && m.recipient_id === user.id) {
      await supabase.from("mails").update({ read: true }).eq("id", m.id);
      setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !composeTo || !composeSubject) return;
    setSending(true);
    const { error } = await supabase.from("mails").insert({
      sender_id: user.id,
      recipient_id: composeTo,
      subject: composeSubject,
      body: composeBody,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Mail sent");
    setCompose(false);
    setComposeTo(""); setComposeSubject(""); setComposeBody("");
    if (folder === "sent") load();
  }

  async function remove(m: MailRow) {
    const { error } = await supabase.from("mails").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((x) => x.id !== m.id));
    if (open?.id === m.id) setOpen(null);
  }

  const list = items.filter((m) => {
    const other = folder === "inbox" ? peopleById[m.sender_id] : peopleById[m.recipient_id];
    const haystack = `${m.subject} ${m.body} ${other?.full_name ?? ""} ${other?.email ?? ""}`.toLowerCase();
    return haystack.includes(q.toLowerCase());
  });
  const unreadCount = items.filter((m) => folder === "inbox" && !m.read).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_360px_1fr] gap-4 h-[calc(100vh-9rem)]">
      <aside className="glass rounded-2xl p-3 space-y-1">
        <button onClick={() => setCompose(true)} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2.5 font-semibold shadow-glow hover:opacity-90 transition">
          <Plus className="size-4" /> Compose
        </button>
        {([
          { k: "inbox" as const, l: "Inbox", Icon: Inbox, n: folder === "inbox" ? unreadCount : 0 },
          { k: "sent" as const, l: "Sent", Icon: SendIcon, n: 0 },
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
          {loading && <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin inline" /></div>}
          {!loading && list.map((m) => {
            const other = folder === "inbox" ? peopleById[m.sender_id] : peopleById[m.recipient_id];
            const name = other?.full_name || other?.email || "Unknown";
            const time = new Date(m.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            return (
              <button key={m.id} onClick={() => openMail(m)} className={`w-full text-left p-4 border-b border-border/60 hover:bg-accent/40 transition ${open?.id === m.id ? "bg-accent/60" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${!m.read && folder === "inbox" ? "font-semibold" : "font-medium"} truncate`}>{folder === "sent" ? `To: ${name}` : name}</div>
                  <div className="text-[11px] text-muted-foreground">{time}</div>
                </div>
                <div className={`text-sm truncate ${!m.read && folder === "inbox" ? "font-medium" : "text-muted-foreground"}`}>{m.subject || "(no subject)"}</div>
                <div className="text-xs text-muted-foreground truncate">{m.body}</div>
                {!m.read && folder === "inbox" && <span className="inline-block mt-1 size-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
          {!loading && list.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No messages</div>}
        </div>
      </section>

      <section className="glass rounded-2xl p-6 overflow-y-auto">
        {open ? (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{open.subject || "(no subject)"}</h2>
              <button onClick={() => remove(open)} className="p-2 rounded-lg hover:bg-accent text-destructive" title="Delete"><Trash2 className="size-4" /></button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {(peopleById[open.sender_id]?.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="text-sm font-medium">{peopleById[open.sender_id]?.full_name || peopleById[open.sender_id]?.email || "Unknown"}</div>
                <div className="text-xs text-muted-foreground">to {peopleById[open.recipient_id]?.full_name || peopleById[open.recipient_id]?.email} · {new Date(open.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-6 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{open.body}</div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Select a message to read</div>
        )}
      </section>

      {compose && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-foreground/30 backdrop-blur-sm" onClick={() => setCompose(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full md:max-w-2xl bg-card rounded-t-2xl md:rounded-2xl shadow-elegant border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="font-semibold">New mail</div>
              <button onClick={() => setCompose(false)} className="p-1.5 rounded-lg hover:bg-accent"><X className="size-4" /></button>
            </div>
            <form onSubmit={send} className="p-4 space-y-3">
              <select required value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option value="">Select recipient…</option>
                {people.filter((p) => p.id !== user?.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name || p.email} {p.department ? `· ${p.department}` : ""}</option>
                ))}
              </select>
              <input required value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="Subject" />
              <textarea required rows={8} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="Write your message…" />
              <div className="flex items-center justify-end pt-1">
                <button disabled={sending} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow disabled:opacity-60">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <SendIcon className="size-4" />} Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
