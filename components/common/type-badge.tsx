import type { QuestionTypeMeta } from "@/lib/types";

export function TypeBadge({
  meta,
  size = "md",
}: {
  meta: QuestionTypeMeta;
  size?: "sm" | "md";
}) {
  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${meta.badgeClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
        Type: {meta.label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium ${meta.badgeClass}`}
    >
      <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}
