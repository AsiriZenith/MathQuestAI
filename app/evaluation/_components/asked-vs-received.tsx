import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { ConfigurationSummary, CoverageReport } from "@/lib/evaluation/types";

function Column({
  eyebrow,
  tone,
  rows,
}: {
  eyebrow: string;
  tone: "asked" | "received";
  rows: { label: string; value: string }[];
}) {
  const style =
    tone === "asked"
      ? "bg-secondary/60 border-border"
      : "bg-primary/5 border-primary/20";
  const eyebrowStyle = tone === "asked" ? "text-muted-foreground" : "text-primary";

  return (
    <div className={`flex-1 min-w-0 border rounded-xl p-4 ${style}`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${eyebrowStyle}`}>{eyebrow}</p>
      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium text-foreground break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Side-by-side view of what the prompt requested against what came back. */
export function AskedVsReceived({
  configuration,
  patternCoverage,
  typeCoverage,
}: {
  configuration: ConfigurationSummary;
  patternCoverage: CoverageReport;
  typeCoverage: CoverageReport;
}) {
  const generatedPatterns = patternCoverage.entries.filter((e) => e.count > 0);
  const generatedTypes = typeCoverage.entries.filter((e) => e.count > 0);

  const askedRows = [
    { label: "Questions", value: String(configuration.requestedQuestionCount) },
    { label: "Difficulty", value: configuration.difficulty },
    {
      label: `Question patterns${configuration.usedAllPatterns ? " (all for subtopic)" : ""}`,
      value: configuration.requestedPatterns.join(", ") || "—",
    },
    {
      label: "Question types",
      value: configuration.usedAiMix
        ? "A varied mix, chosen by the AI"
        : configuration.requestedTypes.map((t) => t.label).join(", ") || "—",
    },
  ];

  const receivedRows = [
    { label: "Questions", value: String(configuration.generatedQuestionCount) },
    {
      label: "Question patterns",
      value:
        generatedPatterns.length > 0
          ? generatedPatterns.map((e) => `${e.count} ${e.label}`).join(", ")
          : patternCoverage.unlabelled > 0
            ? `${patternCoverage.unlabelled} unlabelled`
            : "—",
    },
    {
      label: "Question types",
      value: generatedTypes.map((e) => `${e.count} ${e.label}`).join(", ") || "—",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">
        What the Prompt Asked For vs What Came Back
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        The gap between these two columns is what the rest of this report explains.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        <Column eyebrow="Requested" tone="asked" rows={askedRows} />
        <div className="flex sm:flex-col items-center justify-center shrink-0">
          <ArrowRight className="w-4 h-4 text-muted-foreground sm:rotate-0 rotate-90" />
        </div>
        <Column eyebrow="Generated" tone="received" rows={receivedRows} />
      </div>
    </motion.div>
  );
}
