import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/chat")({
  component: Chat,
  validateSearch: (s: Record<string, unknown>) => ({ to: typeof s.to === "string" ? s.to : undefined }),
});

type Profile = { id: string; full_name: string; email: string; department: string | null };
type Msg = { id: string; sender_id: string; recipient_id: string; body: string; read: boolean; created_at: string };

function Chat() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_app/chat" });
  const [people, setPeople] = useState<Profile[]>([]);
  const [active, setActive] = useState<Profile | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [unreadByPeer, setUnreadByPeer] = useState<Record<string, number>>({});
  const endRef = useRef<HTMLDivElement>(null);

  // Load directory and unread counts
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profiles }, { data: unread }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, department").order("full_name"),
        supabase.from("messages").select("sender_id").eq("recipient_id", user.id).eq("read", false),
      ]);
      const ppl = ((profiles ?? []) as Profile[]).filter((p) => p.id !== user.id);
      setPeople(ppl);
      const counts: Record<string, number> = {};
      (unread ?? []).forEach((r) => { counts[r.sender_id] = (counts[r.sender_id] ?? 0) + 1; });
      setUnreadByPeer(counts);
      // Pick initial peer from search?to or first
      const initial = (search.to && ppl.find((p) => p.id === search.to)) || ppl[0] || null;
      setActive(initial);
      setLoading(false);
    })();
  }, [user?.id]);

  useEffect(() => { if (search.to) { const p = people.find((x) => x.id === search.to); if (p) setActive(p); } }, [search.to, people]);

  // Load messages with active peer + mark read
  useEffect(() => {
    if (!user || !active) return;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${active.id}),and(sender_id.eq.${active.id},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      setMsgs((data ?? []) as Msg[]);
      // Mark incoming as read
      await supabase.from("messages").update({ read: true }).eq("sender_id", active.id).eq("recipient_id", user.id).eq("read", false);
      setUnreadByPeer((p) => ({ ...p, [active.id]: 0 }));
    })();
  }, [user?.id, active?.id]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("messages-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const m = payload.new as Msg;
        const isMine = m.sender_id === user.id;
        const peerId = isMine ? m.recipient_id : m.sender_id;
        // If conversation open, append; otherwise increment unread
        if (active && (peerId === active.id)) {
          setMsgs((prev) => [...prev, m]);
          if (!isMine) {
            await supabase.from("messages").update({ read: true }).eq("id", m.id);
          }
        } else if (!isMine && m.recipient_id === user.id) {
          setUnreadByPeer((p) => ({ ...p, [peerId]: (p[peerId] ?? 0) + 1 }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, active?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    if (!user || !active || !text.trim()) return;
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ sender_id: user.id, recipient_id: active.id, body });
    if (error) setText(body);
  }

  const peopleSorted = useMemo(() => {
    return [...people].sort((a, b) => (unreadByPeer[b.id] ?? 0) - (unreadByPeer[a.id] ?? 0));
  }, [people, unreadByPeer]);
  const filtered = peopleSorted.filter((p) => (p.full_name + " " + p.email).toLowerCase().includes(q.toLowerCase()));

  if (loading) return <div className="text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin inline" /> Loading conversations…</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-9rem)]">
      <aside className="glass rounded-2xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => {
            const initials = (c.full_name || c.email).split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
            const unread = unreadByPeer[c.id] ?? 0;
            return (
              <button key={c.id} onClick={() => setActive(c)} className={`w-full text-left px-3 py-3 flex items-center gap-3 border-b border-border/60 hover:bg-accent/40 transition ${active?.id === c.id ? "bg-accent/60" : ""}`}>
                <div className="size-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">{initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.full_name || c.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.department ?? c.email}</div>
                </div>
                {unread > 0 && <span className="text-[10px] bg-gradient-primary text-primary-foreground rounded-full px-1.5 py-0.5">{unread}</span>}
              </button>
            );
          })}
          {filtered.length === 0 && <div className="p-4 text-xs text-muted-foreground">No people found.</div>}
        </div>
      </aside>

      <section className="glass rounded-2xl flex flex-col overflow-hidden">
        {active ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-semibold">
                {(active.full_name || active.email).split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{active.full_name || active.email}</div>
                <div className="text-xs text-muted-foreground">{active.department ?? active.email}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgs.map((m) => {
                const me = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${me ? "bg-gradient-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"}`}>
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                      <div className={`text-[10px] mt-1 ${me ? "opacity-80" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {msgs.length === 0 && <div className="text-center text-xs text-muted-foreground mt-8">No messages yet — say hi 👋</div>}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-border flex items-center gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`Message ${active.full_name || active.email}…`} className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
              <button onClick={send} className="p-2.5 rounded-lg bg-gradient-primary text-primary-foreground shadow-glow"><Send className="size-4" /></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select someone to start chatting</div>
        )}
      </section>
    </div>
  );
}
