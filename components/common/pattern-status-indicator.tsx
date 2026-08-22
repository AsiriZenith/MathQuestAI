import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import type { PatternStatus } from "@/lib/types";

export function PatternStatusIndicator({ status }: { status: PatternStatus }) {
  if (status === "covered") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="w-4 h-4" />
        Covered
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
        <AlertTriangle className="w-4 h-4" />
        Partially covered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
      <Circle className="w-4 h-4" />
      Not covered
    </span>
  );
}
