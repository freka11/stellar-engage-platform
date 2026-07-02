import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Mail as MailIcon, MessageSquare, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/directory")({ component: Directory });

type Profile = { id: string; full_name: string; department: string | null; avatar_url: string | null };

function Directory() {
  const { user } = useAuth();
  const [people, setPeople] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, department, avatar_url").order("full_name").then(({ data }) => {
      setPeople((data ?? []) as Profile[]);
      setLoading(false);
    });
  }, []);

  const departments = useMemo(() => ["All", ...Array.from(new Set(people.map((p) => p.department).filter(Boolean) as string[])).sort()], [people]);
  const filtered = people
    .filter((p) => p.id !== user?.id)
    .filter((p) => dept === "All" || p.department === dept)
    .filter((p) => (p.full_name + " " + (p.department ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employee directory</h1>
        <p className="text-sm text-muted-foreground">Find colleagues, send a mail or start a direct message.</p>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or department" className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="glass rounded-2xl p-5 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {(p.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.full_name || "Unnamed"}</div>
                  {p.department && <div className="text-xs text-muted-foreground truncate">{p.department}</div>}
                </div>
              </div>
              {p.department && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3" /> {p.department}
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link to="/mail" search={{ to: p.id } as never} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent">
                  <MailIcon className="size-3.5" /> Mail
                </Link>
                <Link to="/chat" search={{ to: p.id } as never} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-primary text-primary-foreground px-3 py-2 text-xs font-semibold shadow-glow">
                  <MessageSquare className="size-3.5" /> Message
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-sm text-muted-foreground">No employees match your filter.</div>}
        </div>
      )}
    </div>
  );
}
