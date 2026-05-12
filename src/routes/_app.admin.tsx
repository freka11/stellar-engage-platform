import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Trash2, Building2, Activity as ActivityIcon, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("cc.auth.user");
      const u = raw ? JSON.parse(raw) : null;
      if (!u || u.role !== "admin") throw redirect({ to: "/dashboard" });
    }
  },
  component: Admin,
});

type Emp = { id: string; name: string; email: string; dept: string; role: string; status: "active" | "invited" };

const initialEmps: Emp[] = [
  { id: "1", name: "Aisha Khan", email: "aisha@crescent.health", dept: "Cardiology", role: "Doctor", status: "active" },
  { id: "2", name: "Liam Carter", email: "liam@crescent.health", dept: "ICU", role: "Nurse", status: "active" },
  { id: "3", name: "Marco Silva", email: "marco@crescent.health", dept: "Radiology", role: "Doctor", status: "active" },
  { id: "4", name: "Priya Patel", email: "priya@crescent.health", dept: "Pharmacy", role: "Pharmacist", status: "invited" },
];

const departments = ["Cardiology", "Radiology", "ICU", "Pharmacy", "Operations", "HR"];

const logs = [
  { who: "Aisha Khan", action: "Uploaded MRI report", ts: "10:24" },
  { who: "Liam Carter", action: "Joined Cardiology group", ts: "09:51" },
  { who: "Admin", action: "Added Priya Patel", ts: "09:10" },
  { who: "Marco Silva", action: "Started video call", ts: "Yesterday" },
];

function Admin() {
  const [emps, setEmps] = useState<Emp[]>(initialEmps);
  const [tab, setTab] = useState<"employees" | "departments" | "logs" | "analytics">("employees");
  const [form, setForm] = useState({ name: "", email: "", dept: departments[0], role: "Doctor" });

  function addEmp(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setEmps((p) => [{ id: crypto.randomUUID(), ...form, status: "invited" }, ...p]);
    setForm({ name: "", email: "", dept: departments[0], role: "Doctor" });
    toast.success("Employee invited");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage employees, departments, activity and analytics.</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {([
          { k: "employees", l: "Employees" },
          { k: "departments", l: "Departments" },
          { k: "logs", l: "Activity Logs" },
          { k: "analytics", l: "Analytics" },
        ] as const).map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${tab === t.k ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{t.l}</button>
        ))}
      </div>

      {tab === "employees" && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {emps.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-accent/40">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">{e.name.split(" ").map(s => s[0]).slice(0,2).join("")}</div>
                        <div><div className="font-medium">{e.name}</div><div className="text-xs text-muted-foreground">{e.email}</div></div>
                      </div>
                    </td>
                    <td className="p-3">{e.dept}</td>
                    <td className="p-3">{e.role}</td>
                    <td className="p-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${e.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground/80"}`}>{e.status}</span></td>
                    <td className="p-3 text-right">
                      <button onClick={() => { setEmps((p) => p.filter((x) => x.id !== e.id)); toast.success("Employee removed"); }} className="p-2 rounded-lg hover:bg-accent text-destructive"><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form onSubmit={addEmp} className="glass rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="font-semibold flex items-center gap-2"><UserPlus className="size-4" /> Invite employee</h3>
            <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="email" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <button className="w-full rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow">Send invitation</button>
          </form>
        </div>
      )}

      {tab === "departments" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => {
            const count = emps.filter((e) => e.dept === d).length;
            return (
              <div key={d} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-3"><div className="size-10 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center"><Building2 className="size-5" /></div><div><div className="font-semibold">{d}</div><div className="text-xs text-muted-foreground">{count} member{count === 1 ? "" : "s"}</div></div></div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "logs" && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><ActivityIcon className="size-4" /> User activity</h2>
          <ul className="divide-y divide-border">
            {logs.map((l, i) => (
              <li key={i} className="py-3 flex items-center justify-between">
                <div className="text-sm"><span className="font-medium">{l.who}</span> <span className="text-muted-foreground">{l.action}</span></div>
                <div className="text-xs text-muted-foreground">{l.ts}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "analytics" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { l: "Total employees", v: emps.length },
            { l: "Active today", v: 184 },
            { l: "Files stored", v: "12.4k" },
            { l: "Calls this week", v: 326 },
          ].map((s) => (
            <div key={s.l} className="glass rounded-2xl p-5">
              <div className="text-xs uppercase text-muted-foreground tracking-wider">{s.l}</div>
              <div className="mt-2 text-3xl font-bold">{s.v}</div>
              <div className="mt-2 text-xs text-success inline-flex items-center gap-1"><BarChart3 className="size-3" /> Trending up</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
