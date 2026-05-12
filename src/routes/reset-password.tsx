import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md glass rounded-2xl p-8 shadow-elegant">
        <Link to="/"><Logo /></Link>
        <h1 className="mt-6 text-2xl font-bold">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 font-semibold shadow-glow disabled:opacity-60">
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
