/** Current-vs-previous delta, colored by sign — never asks the reader to do the subtraction. */
export function DeltaBadge({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (value === null) {
    return (
      <span className="font-jakarta text-xs font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
        N/A
      </span>
    );
  }

  const tone =
    value > 0
      ? "bg-emerald-50 border-emerald-200/60 text-emerald-700"
      : value < 0
        ? "bg-rose-50 border-rose-200/60 text-rose-700"
        : "bg-muted border-border text-muted-foreground";

  const sign = value > 0 ? "+" : "";

  return (
    <span className={`font-jakarta text-xs font-bold border rounded-full px-2 py-0.5 tabular-nums ${tone}`}>
      {sign}
      {value}
      {suffix}
    </span>
  );
}
