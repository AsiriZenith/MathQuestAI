import type { EvaluationResult } from "@/lib/evaluation/types";

/**
 * Render an evaluation as Markdown for a research write-up.
 *
 * Pure and dependency-free so it can run on the client for a direct download
 * without a round trip.
 */
export function toEvaluationMarkdown(result: EvaluationResult): string {
  const lines: string[] = [];
  const { configuration: config } = result;

  lines.push(`# Prompt Evaluation — ${result.promptEffectiveness}% effectiveness (${result.band})`);
  lines.push("");
  lines.push(result.explanation);
  lines.push("");

  lines.push("## Configuration");
  lines.push("");
  lines.push(`- Grade: ${config.grade}`);
  lines.push(`- Subject / Topic / Subtopic: ${config.subject} / ${config.topic} / ${config.subtopic}`);
  lines.push(`- Difficulty: ${config.difficulty}`);
  lines.push(
    `- Question patterns${config.usedAllPatterns ? " (all for subtopic)" : ""}: ${config.requestedPatterns.join(", ") || "—"}`,
  );
  lines.push(
    `- Question types: ${config.usedAiMix ? "AI-chosen mix" : config.requestedTypes.map((t) => t.label).join(", ") || "—"}`,
  );
  lines.push(
    `- Questions: ${config.generatedQuestionCount} generated of ${config.requestedQuestionCount} requested`,
  );
  lines.push("");

  lines.push("## Dimension scores");
  lines.push("");
  lines.push("| Dimension | Score | Weight | Status | Confidence |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const d of result.dimensions) {
    const score = d.score === null ? "N/A" : `${Math.round(d.score * 100)}%`;
    lines.push(
      `| ${d.label} | ${score} | ${d.weight} | ${d.status.replace(/_/g, " ")} | ${d.confidence} |`,
    );
  }
  lines.push("");

  if (result.strengths.length > 0) {
    lines.push("## What worked");
    lines.push("");
    for (const strength of result.strengths) lines.push(`- ${strength.finding}`);
    lines.push("");
  }

  if (result.improvements.length > 0) {
    lines.push("## Prompt improvements");
    lines.push("");
    result.improvements.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.problem}`);
      lines.push("");
      lines.push(`- **Evidence:** ${item.evidence}`);
      lines.push(`- **Likely prompt weakness:** ${item.likelyPromptWeakness}`);
      lines.push(`- **Target:** \`${item.targetFile}\``);
      lines.push("");
      lines.push("```text");
      lines.push(item.suggestedChange);
      lines.push("```");
      lines.push("");
    });
  }

  if (result.deviations.length > 0) {
    lines.push("## Deviations");
    lines.push("");
    lines.push("| Question | Issue | Expected | Observed |");
    lines.push("| --- | --- | --- | --- |");
    for (const d of result.deviations) {
      lines.push(
        `| ${d.questionNumber} | ${d.kind.replace(/_/g, " ")} | ${d.expected} | ${d.observed} |`,
      );
    }
    lines.push("");
  }

  lines.push(`_Evaluated ${result.evaluatedAt}. Experimental prototype metric._`);

  return lines.join("\n");
}
