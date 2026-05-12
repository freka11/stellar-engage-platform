export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative size-9 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="size-5 text-primary-foreground" fill="currentColor">
          <path d="M16 4a8 8 0 1 0 0 16 6 6 0 1 1 0-16z" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight">Crescent Connect</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Medical Enterprise</div>
      </div>
    </div>
  );
}
