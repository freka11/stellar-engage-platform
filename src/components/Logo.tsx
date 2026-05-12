import logoUrl from "@/assets/crescent-logo.png";

export function Logo({ className = "", showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative h-10 w-10 rounded-xl bg-white ring-1 ring-border shadow-sm flex items-center justify-center overflow-hidden">
        <img src={logoUrl} alt="Crescent Formulations" className="h-8 w-8 object-contain" />
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-semibold tracking-tight">Crescent Mail</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Crescent Formulations Pvt. Ltd.</div>
        </div>
      )}
    </div>
  );
}
