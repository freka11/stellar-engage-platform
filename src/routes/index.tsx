import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ArrowRight, Shield, MessageSquare, Video, Mail, FolderLock, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("cc.auth.user")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Landing,
});

const features = [
  { icon: MessageSquare, title: "Realtime Chat", desc: "Encrypted team messaging with presence and typing indicators." },
  { icon: Video, title: "Video & Audio Calls", desc: "HD calls with mute, camera and call management built-in." },
  { icon: Mail, title: "Company Mail", desc: "Internal mailbox with attachments and powerful search." },
  { icon: FolderLock, title: "Secure Storage", desc: "HIPAA-aware vault for reports, scans and patient files." },
  { icon: BarChart3, title: "Analytics", desc: "Live dashboards on activity, performance and adoption." },
  { icon: Shield, title: "Role-based Access", desc: "Granular permissions for clinicians, staff and admins." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-30 bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Logo />
          <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-90 transition">
            Sign in <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6">
        <section className="py-20 md:py-28 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-2 rounded-full bg-success animate-pulse-ring" />
            HIPAA-aware · SOC 2 ready
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
            The communication backbone for{" "}
            <span className="text-gradient">modern medical teams</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Chat, calls, mail and secure file storage — unified in one enterprise-grade workspace built for clinicians, administrators and care teams.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition">
              Launch workspace <ArrowRight className="size-4" />
            </Link>
            <a href="#features" className="rounded-lg px-6 py-3 text-sm font-semibold border border-border hover:bg-accent transition">Explore features</a>
          </div>
        </section>

        <section id="features" className="pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:shadow-elegant transition group">
              <div className="size-11 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow group-hover:scale-105 transition">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Crescent Connect Medical. All rights reserved.
      </footer>
    </div>
  );
}
