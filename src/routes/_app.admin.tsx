import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Users as UsersIcon, Mail as MailIcon, MessageSquare, BarChart3, Building2, Activity as ActivityIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/admin")({ component: Admin });

type Profile = { id: string; full_name: string; email?: string | null; department: string | null; created_at: string };

function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user && user.role !== "admin") navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  const [tab, setTab] = useState<"analytics" | "employees" | "departments" | "activity">("analytics");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [counts, setCounts] = useState({ mails: 0, messages: 0, mails7d: 0, messages7d: 0, activeToday: 0 });
  const [perDay, setPerDay] = useState<{ d: string; mails: number; msgs: number }[]>([]);
  const [recent, setRecent] = useState<{ kind: "mail" | "msg"; from: string; to: string; preview: string; at: string }[]>([]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    (async () => {
      const now = new Date();
      const since7 = new Date(now); since7.setDate(now.getDate() - 7);
      const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);

      const [profs, mailsAll, msgsAll, mails7, msgs7, mailsRecent, msgsRecent, activeMailers, activeChatters] = await Promise.all([
        supabase.from("profiles").select("id, full_name, department, created_at").order("created_at", { ascending: false }),
        supabase.from("mails").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("mails").select("id, created_at").gte("created_at", since7.toISOString()),
        supabase.from("messages").select("id, created_at").gte("created_at", since7.toISOString()),
        supabase.from("mails").select("id, sender_id, recipient_id, subject, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("messages").select("id, sender_id, recipient_id, body, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("mails").select("sender_id").gte("created_at", startToday.toISOString()),
        supabase.from("messages").select("sender_id").gte("created_at", startToday.toISOString()),
      ]);

      const ppl = (profs.data ?? []) as Profile[];
      setProfiles(ppl);
      const byId = Object.fromEntries(ppl.map((p) => [p.id, p.full_name || "Unknown"]));

      const active = new Set<string>();
      (activeMailers.data ?? []).forEach((r) => active.add(r.sender_id));
      (activeChatters.data ?? []).forEach((r) => active.add(r.sender_id));

      setCounts({
        mails: mailsAll.count ?? 0,
        messages: msgsAll.count ?? 0,
        mails7d: mails7.data?.length ?? 0,
        messages7d: msgs7.data?.length ?? 0,
        activeToday: active.size,
      });

      // Per-day buckets last 7 days
      const days: { d: string; mails: number; msgs: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        days.push({ d: key, mails: 0, msgs: 0 });
      }
      const dayIdx = Object.fromEntries(days.map((x, i) => [x.d, i]));
      (mails7.data ?? []).forEach((r) => { const k = r.created_at.slice(0, 10); if (k in dayIdx) days[dayIdx[k]].mails++; });
      (msgs7.data ?? []).forEach((r) => { const k = r.created_at.slice(0, 10); if (k in dayIdx) days[dayIdx[k]].msgs++; });
      setPerDay(days);

      const merged = [
        ...((mailsRecent.data ?? []).map((m) => ({ kind: "mail" as const, from: byId[m.sender_id] ?? "Unknown", to: byId[m.recipient_id] ?? "Unknown", preview: m.subject || "(no subject)", at: m.created_at }))),
        ...((msgsRecent.data ?? []).map((m) => ({ kind: "msg" as const, from: byId[m.sender_id] ?? "Unknown", to: byId[m.recipient_id] ?? "Unknown", preview: m.body, at: m.created_at }))),
      ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
      setRecent(merged);
    })();
  }, [user?.id]);

  const departments = Array.from(new Set(profiles.map((p) => p.department).filter(Boolean) as string[]));
  const maxBar = Math.max(1, ...perDay.flatMap((x) => [x.mails, x.msgs]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin panel</h1>
        <p className="text-sm text-muted-foreground">Monitor internal communication activity across the organization.</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {([
          { k: "analytics", l: "Analytics" },
          { k: "employees", l: "Employees" },
          { k: "departments", l: "Departments" },
          { k: "activity", l: "Activity" },
        ] as const).map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${tab === t.k ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{t.l}</button>
        ))}
      </div>

      {tab === "analytics" && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Stat label="Employees" value={profiles.length} Icon={UsersIcon} />
            <Stat label="Active today" value={counts.activeToday} Icon={ActivityIcon} />
            <Stat label="Total mails" value={counts.mails} Icon={MailIcon} />
            <Stat label="Total messages" value={counts.messages} Icon={MessageSquare} />
            <Stat label="Last 7 days" value={counts.mails7d + counts.messages7d} Icon={BarChart3} />
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Communication volume — last 7 days</h2>
            <div className="flex items-end gap-3 h-48">
              {perDay.map((b) => (
                <div key={b.d} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-1 h-40">
                    <div className="flex-1 rounded-t-md bg-gradient-primary shadow-glow transition-all" title={`Mails: ${b.mails}`} style={{ height: `${(b.mails / maxBar) * 100}%` }} />
                    <div className="flex-1 rounded-t-md bg-accent border border-border transition-all" title={`Messages: ${b.msgs}`} style={{ height: `${(b.msgs / maxBar) * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{new Date(b.d).toLocaleDateString([], { weekday: "short" })}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded bg-gradient-primary" /> Mails</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded bg-accent border border-border" /> Messages</span>
            </div>
          </div>
        </>
      )}

      {tab === "employees" && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Department</th>
                <th className="text-left p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-accent/40">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">{(p.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}</div>
                      <div className="font-medium">{p.full_name || "—"}</div>
                    </div>
                  </td>
                  <td className="p-3">{p.department ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "departments" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.length === 0 && <div className="text-sm text-muted-foreground">No departments yet.</div>}
          {departments.map((d) => {
            const count = profiles.filter((p) => p.department === d).length;
            return (
              <div key={d} className="glass rounded-2xl p-5 flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center"><Building2 className="size-5" /></div>
                <div><div className="font-semibold">{d}</div><div className="text-xs text-muted-foreground">{count} member{count === 1 ? "" : "s"}</div></div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "activity" && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><ActivityIcon className="size-4" /> Recent communication</h2>
          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No activity yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((r, i) => (
                <li key={i} className="py-3 flex items-start gap-3">
                  <span className={`mt-1 inline-flex items-center justify-center size-7 rounded-lg ${r.kind === "mail" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
                    {r.kind === "mail" ? <MailIcon className="size-3.5" /> : <MessageSquare className="size-3.5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm"><span className="font-medium">{r.from}</span> <span className="text-muted-foreground">→</span> <span className="font-medium">{r.to}</span></div>
                    <div className="text-xs text-muted-foreground truncate">{r.preview}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, Icon }: { label: string; value: number; Icon: typeof UsersIcon }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase text-muted-foreground tracking-wider">{label}</div>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}
