import type { SummaryItem } from "@/lib/types";

export function SessionSummaryCard({ items }: { items: SummaryItem[] }) {
  return (
    <div className="md:sticky md:top-8">
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="p-5">
          <p className="font-jakarta text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-4">
            Practice Session
          </p>
          <div className="space-y-3.5">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <item.Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-jakarta text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[0.72rem] text-muted-foreground text-center mt-3 leading-relaxed px-1">
        Questions are generated fresh each session and never repeated.
      </p>
    </div>
  );
}
