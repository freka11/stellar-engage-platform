import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, MessageSquare, Mail as MailIcon, Inbox, TrendingUp, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ employees: 0, unreadMail: 0, unreadMsgs: 0, sentToday: 0 });
  const [recentMail, setRecentMail] = useState<{ id: string; subject: string; created_at: string; sender?: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(); since.setHours(0, 0, 0, 0);
      const [emp, unreadMail, unreadMsgs, sentToday, recent, profiles] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("mails").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("read", false),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("read", false),
        supabase.from("mails").select("id", { count: "exact", head: true }).eq("sender_id", user.id).gte("created_at", since.toISOString()),
        supabase.from("mails").select("id, subject, created_at, sender_id").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, full_name, email"),
      ]);
      const byId = Object.fromEntries((profiles.data ?? []).map((p) => [p.id, p.full_name || p.email]));
      setStats({
        employees: emp.count ?? 0,
        unreadMail: unreadMail.count ?? 0,
        unreadMsgs: unreadMsgs.count ?? 0,
        sentToday: sentToday.count ?? 0,
      });
      setRecentMail((recent.data ?? []).map((r) => ({ id: r.id, subject: r.subject || "(no subject)", created_at: r.created_at, sender: byId[r.sender_id] })));
    })();
  }, [user?.id]);

  const cards = [
    { label: "Employees", value: stats.employees, icon: Users, color: "from-emerald-500 to-teal-500", to: "/directory" },
    { label: "Unread mail", value: stats.unreadMail, icon: Inbox, color: "from-cyan-500 to-sky-500", to: "/mail" },
    { label: "Unread messages", value: stats.unreadMsgs, icon: MessageSquare, color: "from-indigo-500 to-violet-500", to: "/chat" },
    { label: "Mail sent today", value: stats.sentToday, icon: MailIcon, color: "from-amber-500 to-orange-500", to: "/mail" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        <p className="text-sm text-muted-foreground">Your private internal communication overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((s) => (
          <Link key={s.label} to={s.to} className="glass rounded-2xl p-5 hover:shadow-elegant transition">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</div>
                <div className="mt-2 text-3xl font-bold">{s.value}</div>
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-success font-medium"><TrendingUp className="size-3" /> Live</div>
              </div>
              <div className={`size-11 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md`}>
                <s.icon className="size-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent inbox</h2>
            <Link to="/mail" className="text-xs text-primary hover:underline">Open mailbox</Link>
          </div>
          {recentMail.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No mail yet. Visit the directory to send your first internal mail.</div>
          ) : (
            <ul className="divide-y divide-border">
              {recentMail.map((m) => (
                <li key={m.id} className="py-3 flex items-start gap-3">
                  <div className="size-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {(m.sender ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.subject}</div>
                    <div className="text-xs text-muted-foreground">{m.sender ?? "Unknown"} · {new Date(m.created_at).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><Bell className="size-4" /> Notifications</h2>
          <div className="space-y-3">
            <Notice title={`${stats.unreadMail} unread mail`} body="Catch up on internal communications." level="info" />
            <Notice title={`${stats.unreadMsgs} unread messages`} body="Your colleagues are waiting on a reply." level={stats.unreadMsgs > 0 ? "warning" : "success"} />
            <Notice title="Encrypted at rest" body="All internal communication is private to participants." level="success" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Notice({ title, body, level }: { title: string; body: string; level: "warning" | "info" | "success" }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${level === "warning" ? "bg-warning" : level === "success" ? "bg-success" : "bg-primary"}`} />
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{body}</div>
    </div>
  );
}
