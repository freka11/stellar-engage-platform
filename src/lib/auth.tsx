import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "employee";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string;
  avatar?: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, expectedRole: Role) => Promise<void>;
  signUp: (data: { email: string; password: string; fullName: string; role: Role; department: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

async function loadProfile(userId: string, email: string): Promise<AuthUser | null> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("full_name, department, avatar_url").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const role = (roles?.[0]?.role as Role) ?? "employee";
  return {
    id: userId,
    email,
    name: profile?.full_name?.trim() || email.split("@")[0],
    role,
    department: profile?.department ?? undefined,
    avatar: profile?.avatar_url ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe FIRST so we never miss an event
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // Defer Supabase calls to avoid deadlock inside the listener
        setTimeout(() => {
          loadProfile(sess.user.id, sess.user.email ?? "").then((u) => {
            setUser(u);
            setLoading(false);
          });
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // 2. Then check existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        loadProfile(sess.user.id, sess.user.email ?? "").then((u) => {
          setUser(u);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password, expectedRole) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const profile = await loadProfile(data.user.id, data.user.email ?? email);
      if (profile && profile.role !== expectedRole) {
        await supabase.auth.signOut();
        throw new Error(
          `This account is registered as ${profile.role}. Switch to the ${profile.role === "admin" ? "Admin" : "Employee"} tab and try again.`
        );
      }
    }
  };

  const signUp: AuthCtx["signUp"] = async ({ email, password, fullName, department }) => {
    const redirectTo = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        // Role is intentionally NOT sent from the client. New users are always
        // provisioned as 'employee' by the server-side handle_new_user trigger.
        // Admin promotion must be performed by an existing admin.
        data: { full_name: fullName, department },
      },
    });
    if (error) throw error;
  };

  const resetPassword: AuthCtx["resetPassword"] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, session, loading, signIn, signUp, resetPassword, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
