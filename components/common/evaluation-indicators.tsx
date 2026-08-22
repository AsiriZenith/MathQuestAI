import { AlertTriangle, CheckCircle2, CircleSlash, XCircle } from "lucide-react";
import type { AdherenceStatus, Confidence } from "@/lib/evaluation/types";

/**
 * Signals how much trust a score deserves. Shown on every dimension so a
 * structural proxy is never mistaken for a semantic measurement.
 */
export function ConfidenceChip({ confidence }: { confidence: Confidence }) {
  const style =
    confidence === "high"
      ? "bg-emerald-50 border-emerald-200/60 text-emerald-700"
      : "bg-amber-50 border-amber-200/60 text-amber-700";

  return (
    <span
      className={`font-jakarta inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[0.65rem] font-bold uppercase tracking-wide ${style}`}
    >
      {confidence === "high" ? "Measured" : "Proxy"}
    </span>
  );
}

export function StatusIcon({ status, className = "w-4 h-4" }: { status: AdherenceStatus; className?: string }) {
  if (status === "met") return <CheckCircle2 className={`${className} text-emerald-600`} />;
  if (status === "partial") return <AlertTriangle className={`${className} text-amber-600`} />;
  if (status === "not_met") return <XCircle className={`${className} text-rose-600`} />;
  return <CircleSlash className={`${className} text-muted-foreground`} />;
}

export function statusLabel(status: AdherenceStatus): string {
  if (status === "met") return "Met";
  if (status === "partial") return "Partially met";
  if (status === "not_met") return "Not met";
  return "Not applicable";
}

export function StatusPill({ status }: { status: AdherenceStatus }) {
  const style: Record<AdherenceStatus, string> = {
    met: "bg-emerald-50 border-emerald-200/60 text-emerald-700",
    partial: "bg-amber-50 border-amber-200/60 text-amber-700",
    not_met: "bg-rose-50 border-rose-200/60 text-rose-700",
    not_applicable: "bg-secondary/60 border-border text-muted-foreground",
  };

  return (
    <span
      className={`font-jakarta inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${style[status]}`}
    >
      <StatusIcon status={status} className="w-3.5 h-3.5" />
      {statusLabel(status)}
    </span>
  );
}
