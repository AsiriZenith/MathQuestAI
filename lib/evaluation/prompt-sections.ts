import type { DimensionId, PromptSectionId } from "@/lib/evaluation/types";

interface SectionDefinition {
  id: PromptSectionId;
  heading: string;
  /** Dimensions that hold this section accountable. */
  dimensionIds: DimensionId[];
}

/**
 * The seven sections emitted by lib/prompts/builder.ts, mapped to the dimensions
 * that measure whether each one landed. This mapping is what lets a weak score
 * point at a specific, editable block of prompt text.
 */
export const PROMPT_SECTIONS: SectionDefinition[] = [
  { id: "common_instructions", heading: "COMMON INSTRUCTIONS", dimensionIds: [] },
  { id: "generation_requirement", heading: "GENERATION REQUIREMENT", dimensionIds: ["count_adherence"] },
  { id: "educational_context", heading: "EDUCATIONAL CONTEXT", dimensionIds: ["pattern_adherence"] },
  { id: "difficulty", heading: "DIFFICULTY", dimensionIds: ["difficulty_alignment"] },
  { id: "question_type", heading: "QUESTION TYPE", dimensionIds: ["type_adherence"] },
  { id: "reference_questions", heading: "REFERENCE QUESTIONS", dimensionIds: ["reference_alignment"] },
  { id: "output_format", heading: "OUTPUT FORMAT", dimensionIds: ["output_integrity"] },
];

/**
 * Split a preserved prompt string back into its sections.
 *
 * Sections are located by their known headings rather than by parsing structure,
 * so an unrecognised or reordered prompt degrades to empty bodies instead of
 * throwing.
 */
export function splitPromptSections(prompt: string): Record<PromptSectionId, string> {
  const result = {} as Record<PromptSectionId, string>;

  for (let i = 0; i < PROMPT_SECTIONS.length; i += 1) {
    const section = PROMPT_SECTIONS[i];
    const startIndex = prompt.indexOf(section.heading);
    if (startIndex === -1) {
      result[section.id] = "";
      continue;
    }

    // The body ends where the next recognised heading begins.
    let endIndex = prompt.length;
    for (let j = i + 1; j < PROMPT_SECTIONS.length; j += 1) {
      const nextIndex = prompt.indexOf(PROMPT_SECTIONS[j].heading, startIndex + 1);
      if (nextIndex !== -1) {
        endIndex = nextIndex;
        break;
      }
    }

    result[section.id] = prompt
      .slice(startIndex + section.heading.length, endIndex)
      .replace(/^\s*-+\s*/, "")
      .trim();
  }

  return result;
}

/**
 * Whether the prompt asked the model to tag questions with their pattern id.
 * Runs generated before that instruction existed cannot be scored on pattern
 * adherence, and are reported as not-applicable instead.
 */
export function promptRequestsPatternIds(prompt: string): boolean {
  return prompt.includes("questionPatternId");
}
