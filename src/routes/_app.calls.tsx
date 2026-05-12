import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Volume2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/calls")({ component: Calls });

const recent = [
  { name: "Dr. Aisha Khan", type: "video" as const, when: "Today, 10:24" },
  { name: "Cardiology Team", type: "audio" as const, when: "Today, 09:10" },
  { name: "Nurse Liam", type: "video" as const, when: "Yesterday, 18:02" },
  { name: "Dr. Marco Silva", type: "audio" as const, when: "Yesterday, 14:55" },
];

function Calls() {
  const [inCall, setInCall] = useState<{ name: string; type: "audio" | "video" } | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!inCall) return setT(0);
    const i = setInterval(() => setT((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [inCall]);

  function start(name: string, type: "audio" | "video") {
    setInCall({ name, type });
    setMuted(false);
    setCamOn(type === "video");
  }
  function end() {
    toast.success("Call ended");
    setInCall(null);
  }

  if (inCall) {
    const mins = String(Math.floor(t / 60)).padStart(2, "0");
    const secs = String(t % 60).padStart(2, "0");
    return (
      <div className="h-[calc(100vh-9rem)] rounded-2xl overflow-hidden relative bg-foreground/95 text-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.4_0.1_185_/_0.6),transparent_50%),radial-gradient(circle_at_70%_80%,oklch(0.35_0.12_175_/_0.5),transparent_50%)]" />
        <div className="relative h-full flex flex-col items-center justify-center gap-6">
          <div className="absolute top-6 left-6 flex items-center gap-2 text-xs font-medium">
            <span className="size-2 rounded-full bg-success animate-pulse" /> Live · {mins}:{secs}
          </div>
          {inCall.type === "video" && camOn ? (
            <div className="size-64 md:size-80 rounded-3xl bg-gradient-primary shadow-glow flex items-center justify-center text-6xl font-bold text-primary-foreground">
              {inCall.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
          ) : (
            <div className="size-40 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center text-4xl font-bold text-primary-foreground animate-pulse-ring">
              {inCall.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
          )}
          <div className="text-center">
            <div className="text-2xl font-semibold">{inCall.name}</div>
            <div className="text-sm opacity-70 capitalize">{inCall.type} call · End-to-end encrypted</div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <CallBtn onClick={() => setMuted((m) => !m)} active={!muted}>{muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}</CallBtn>
            {inCall.type === "video" && (
              <CallBtn onClick={() => setCamOn((c) => !c)} active={camOn}>{camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}</CallBtn>
            )}
            <CallBtn active><Volume2 className="size-5" /></CallBtn>
            <button onClick={end} className="size-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-elegant hover:opacity-90">
              <PhoneOff className="size-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calls</h1>
        <p className="text-sm text-muted-foreground">Start an encrypted audio or video call with your colleagues.</p>
      </div>
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-3">Quick start</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={() => start("Dr. Aisha Khan", "video")} className="flex items-center justify-between rounded-xl bg-gradient-primary text-primary-foreground p-5 shadow-glow hover:opacity-90 transition">
            <div className="text-left"><div className="text-sm opacity-80">Start video call</div><div className="text-lg font-semibold">Dr. Aisha Khan</div></div>
            <Video className="size-6" />
          </button>
          <button onClick={() => start("Cardiology Team", "audio")} className="flex items-center justify-between rounded-xl bg-card border border-border p-5 hover:bg-accent transition">
            <div className="text-left"><div className="text-sm text-muted-foreground">Audio call</div><div className="text-lg font-semibold">Cardiology Team</div></div>
            <Phone className="size-6" />
          </button>
        </div>
      </div>
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Recent calls</h2>
        <ul className="divide-y divide-border">
          {recent.map((r, i) => (
            <li key={i} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">{r.name.split(" ").map(s => s[0]).slice(0,2).join("")}</div>
                <div><div className="text-sm font-medium">{r.name}</div><div className="text-xs text-muted-foreground capitalize">{r.type} · {r.when}</div></div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => start(r.name, "audio")} className="p-2 rounded-lg hover:bg-accent"><Phone className="size-4" /></button>
                <button onClick={() => start(r.name, "video")} className="p-2 rounded-lg hover:bg-accent"><Video className="size-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CallBtn({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={`size-14 rounded-full flex items-center justify-center transition ${active ? "bg-background/20 hover:bg-background/30 text-background" : "bg-destructive/80 text-destructive-foreground"}`}>
      {children}
    </button>
  );
}
