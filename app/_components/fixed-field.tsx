export function FixedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="font-jakarta block text-sm font-semibold text-foreground mb-2">
        {label}
      </label>
      <div className="flex items-center justify-between bg-muted border border-border rounded-xl px-4 py-3 gap-2">
        <span className="text-[0.95rem] text-foreground/70">{value}</span>
        <span className="font-jakarta shrink-0 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded-md">
          Fixed
        </span>
      </div>
    </div>
  );
}
