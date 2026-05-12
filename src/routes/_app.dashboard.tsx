import { createFileRoute } from "@tanstack/react-router";
import { Activity, Users, MessageSquare, FileText, TrendingUp, Bell } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

const stats = [
  { label: "Active Employees", value: "248", delta: "+12 this week", icon: Users, color: "from-emerald-500 to-teal-500" },
  { label: "Messages Today", value: "1,842", delta: "+23%", icon: MessageSquare, color: "from-cyan-500 to-sky-500" },
  { label: "Files Uploaded", value: "327", delta: "+8% vs last week", icon: FileText, color: "from-indigo-500 to-violet-500" },
  { label: "System Activity", value: "98.7%", delta: "Operational", icon: Activity, color: "from-amber-500 to-orange-500" },
];

const activities = [
  { who: "Dr. Aisha Khan", what: "uploaded MRI report for Patient #2941", when: "2m ago" },
  { who: "Nurse Liam", what: "joined the Cardiology group chat", when: "12m ago" },
  { who: "Admin", what: "added 3 new employees to Radiology", when: "1h ago" },
  { who: "Dr. Marco Silva", what: "scheduled a video consult at 4:00 PM", when: "2h ago" },
  { who: "Pharmacy", what: "shared updated medication protocol", when: "3h ago" },
];

const notifications = [
  { title: "Compliance training", body: "Annual HIPAA refresh due in 5 days.", level: "warning" as const },
  { title: "New policy", body: "Updated incident reporting workflow.", level: "info" as const },
  { title: "Backup complete", body: "Encrypted backup finished at 02:14.", level: "success" as const },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening across your organization today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5 hover:shadow-elegant transition">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</div>
                <div className="mt-2 text-3xl font-bold">{s.value}</div>
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-success font-medium"><TrendingUp className="size-3" /> {s.delta}</div>
              </div>
              <div className={`size-11 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md`}>
                <s.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <ul className="divide-y divide-border">
            {activities.map((a, i) => (
              <li key={i} className="py-3 flex items-start gap-3">
                <div className="size-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">{a.who.split(" ").map(s => s[0]).slice(0,2).join("")}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm"><span className="font-medium">{a.who}</span> <span className="text-muted-foreground">{a.what}</span></div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Bell className="size-4" /> Notifications</h2>
          </div>
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <div key={i} className="rounded-xl border border-border p-3 hover:bg-accent/40 transition">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${n.level === "warning" ? "bg-warning" : n.level === "success" ? "bg-success" : "bg-primary"}`} />
                  <div className="text-sm font-medium">{n.title}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Engagement (last 7 days)</h2>
        <Sparkline />
      </div>
    </div>
  );
}

function Sparkline() {
  const values = [40, 62, 55, 78, 70, 92, 88];
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-3 h-40">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full rounded-t-lg bg-gradient-primary shadow-glow transition-all" style={{ height: `${(v / max) * 100}%` }} />
          <div className="text-[10px] text-muted-foreground">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</div>
        </div>
      ))}
    </div>
  );
}
