import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard, MessageSquare, Mail, Users, Shield, LogOut,
  Bell, Search, Sun, Moon, Menu, X,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

const baseNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mail", label: "Mail", icon: Mail },
  { to: "/chat", label: "Messages", icon: MessageSquare },
  { to: "/directory", label: "Directory", icon: Users },
] as const;

function AppShell() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  const nav = user.role === "admin" ? [...baseNav, { to: "/admin", label: "Admin", icon: Shield }] : baseNav;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <Link to="/dashboard"><Logo /></Link>
          <button className="lg:hidden text-muted-foreground" onClick={() => setOpen(false)}><X className="size-5" /></button>
        </div>
        <nav className="p-3 flex-1 space-y-1">
          {nav.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent">
            <div className="size-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate capitalize">{user.role} · {user.department}</div>
            </div>
            <button onClick={async () => { await signOut(); navigate({ to: "/login" }); }} className="text-muted-foreground hover:text-destructive p-1.5" title="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-background/70 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
            <button className="lg:hidden p-2 -ml-2" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
            <div className="flex-1 max-w-xl relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Search messages, files, people…" className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-accent" title="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button className="relative p-2 rounded-lg hover:bg-accent">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
