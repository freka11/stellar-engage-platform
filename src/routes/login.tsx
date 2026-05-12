import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, type Role } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Shield, Eye, EyeOff, Loader2, Stethoscope, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return toast.error("Enter your credentials");
    setLoading(true);
    try {
      await login(email, password, role);
      toast.success(`Welcome back${role === "admin" ? ", Admin" : ""}`);
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (forgot) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send you reset instructions.</p>
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Reset link sent (demo)"); setForgot(false); }} className="mt-6 space-y-4">
          <Field label="Work email"><input className="input" type="email" required placeholder="you@hospital.com" /></Field>
          <button className="btn-primary w-full">Send reset link</button>
          <button type="button" onClick={() => setForgot(false)} className="text-sm text-muted-foreground hover:text-foreground w-full">Back to sign in</button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 text-success" /> Encrypted · SSO ready
      </div>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Sign in to Crescent Connect</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose your role to access the right workspace.</p>

      <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
        {(["employee", "admin"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${role === r ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {r === "admin" ? <Shield className="size-4" /> : <Stethoscope className="size-4" />}
            {r === "admin" ? "Admin" : "Employee"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Work email">
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={role === "admin" ? "admin@crescent.health" : "doctor@crescent.health"} />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input className="input pr-10" type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="accent-primary" /> Remember me</label>
          <button type="button" onClick={() => setForgot(true)} className="text-primary hover:underline">Forgot password?</button>
        </div>
        <button disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : `Sign in as ${role === "admin" ? "Admin" : "Employee"}`}
        </button>
        <p className="text-center text-xs text-muted-foreground">By signing in you agree to our Terms and HIPAA policies.</p>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_40%),radial-gradient(circle_at_70%_80%,white,transparent_40%)]" />
        <div className="relative">
          <Link to="/"><Logo className="text-primary-foreground [&_*]:text-primary-foreground" /></Link>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight max-w-md">Care teams move faster when their tools speak the same language.</h2>
          <p className="text-primary-foreground/80 max-w-md">A unified workspace for clinicians and administrators — secure by default, built for the pace of modern healthcare.</p>
          <div className="flex gap-6 text-sm">
            <Stat n="99.99%" l="Uptime SLA" />
            <Stat n="HIPAA" l="Compliant" />
            <Stat n="SOC 2" l="Type II" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md glass rounded-2xl p-8 shadow-elegant">
          <div className="lg:hidden mb-6"><Link to="/"><Logo /></Link></div>
          {children}
        </div>
      </div>
      <style>{`
        .input { width: 100%; border-radius: 0.6rem; border: 1px solid var(--color-border); background: var(--color-card); padding: 0.625rem 0.75rem; font-size: 0.875rem; outline: none; transition: all .15s; }
        .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 25%, transparent); }
        .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; border-radius: 0.6rem; background-image: var(--gradient-primary); color: var(--color-primary-foreground); padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 600; box-shadow: var(--shadow-glow); transition: opacity .15s; }
        .btn-primary:hover { opacity: .9; }
        .btn-primary:disabled { opacity: .6; }
      `}</style>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (<div><div className="text-2xl font-bold">{n}</div><div className="text-xs opacity-80">{l}</div></div>);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
