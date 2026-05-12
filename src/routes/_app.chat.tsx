import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, Send, Paperclip, Smile, Phone, Video, Users, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/chat")({ component: Chat });

type Conv = { id: string; name: string; last: string; time: string; unread?: number; online: boolean; group?: boolean };
type Msg = { id: string; from: string; text: string; time: string; me?: boolean };

const conversations: Conv[] = [
  { id: "1", name: "Dr. Aisha Khan", last: "I'll review the MRI shortly.", time: "2m", unread: 2, online: true },
  { id: "2", name: "Cardiology Team", last: "Liam: Rounds at 9?", time: "12m", unread: 5, online: true, group: true },
  { id: "3", name: "Nurse Liam", last: "Thanks!", time: "1h", online: false },
  { id: "4", name: "Radiology Group", last: "Scan results uploaded", time: "3h", online: true, group: true },
  { id: "5", name: "Dr. Marco Silva", last: "See you at 4 PM", time: "Yesterday", online: false },
];

const initial: Record<string, Msg[]> = {
  "1": [
    { id: "a", from: "Dr. Aisha Khan", text: "Hi, did you get the latest MRI?", time: "10:21" },
    { id: "b", from: "Me", text: "Yes — uploading the report now.", time: "10:22", me: true },
    { id: "c", from: "Dr. Aisha Khan", text: "I'll review the MRI shortly.", time: "10:24" },
  ],
};

function Chat() {
  const { user } = useAuth();
  const [active, setActive] = useState<Conv>(conversations[0]);
  const [msgs, setMsgs] = useState<Msg[]>(initial["1"]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [q, setQ] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  function send() {
    if (!text.trim()) return;
    const m: Msg = { id: crypto.randomUUID(), from: "Me", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), me: true };
    setMsgs((p) => [...p, m]);
    setText("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((p) => [...p, { id: crypto.randomUUID(), from: active.name, text: "Got it — thanks!", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      setTyping(false);
    }, 1400);
  }

  const filtered = conversations.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-9rem)]">
      <aside className="glass rounded-2xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          <button className="p-2 rounded-lg bg-gradient-primary text-primary-foreground shadow-glow"><Plus className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => { setActive(c); setMsgs(initial[c.id] ?? [{ id: "x", from: c.name, text: "Hello!", time: "09:00" }]); }} className={`w-full text-left px-3 py-3 flex items-center gap-3 border-b border-border/60 hover:bg-accent/40 transition ${active.id === c.id ? "bg-accent/60" : ""}`}>
              <div className="relative">
                <div className="size-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {c.group ? <Users className="size-5" /> : c.name.split(" ").map(s => s[0]).slice(0,2).join("")}
                </div>
                <span className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-card ${c.online ? "bg-success" : "bg-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><div className="text-sm font-medium truncate">{c.name}</div><div className="text-[10px] text-muted-foreground">{c.time}</div></div>
                <div className="flex items-center justify-between"><div className="text-xs text-muted-foreground truncate">{c.last}</div>{c.unread && <span className="text-[10px] bg-gradient-primary text-primary-foreground rounded-full px-1.5 py-0.5">{c.unread}</span>}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="glass rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-semibold">{active.group ? <Users className="size-5" /> : active.name.split(" ").map(s => s[0]).slice(0,2).join("")}</div>
            <div>
              <div className="font-medium">{active.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${active.online ? "bg-success" : "bg-muted-foreground"}`} />
                {active.online ? "Online" : "Offline"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-accent"><Phone className="size-4" /></button>
            <button className="p-2 rounded-lg hover:bg-accent"><Video className="size-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${m.me ? "bg-gradient-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"}`}>
                {!m.me && <div className="text-[10px] font-medium opacity-70 mb-0.5">{m.from}</div>}
                <div>{m.text}</div>
                <div className={`text-[10px] mt-1 ${m.me ? "opacity-80" : "text-muted-foreground"}`}>{m.time}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              {active.name} is typing…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t border-border flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Paperclip className="size-4" /></button>
          <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Smile className="size-4" /></button>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`Message ${active.name}…`} className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <button onClick={send} className="p-2.5 rounded-lg bg-gradient-primary text-primary-foreground shadow-glow"><Send className="size-4" /></button>
        </div>
      </section>
      <p className="hidden">{user?.name}</p>
    </div>
  );
}
