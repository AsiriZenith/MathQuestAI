export function SelectionSummary({
  grade,
  items,
}: {
  grade: string;
  items: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 bg-secondary/60 border border-border rounded-xl px-4 py-3 mb-8 text-sm text-foreground/80">
      <span className="font-semibold text-foreground">{grade}</span>
      {items.map((item) => (
        <span key={item} className="flex items-center gap-2.5">
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          {item}
        </span>
      ))}
    </div>
  );
}
