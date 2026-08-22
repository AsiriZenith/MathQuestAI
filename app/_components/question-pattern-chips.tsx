import { ListChecks } from "lucide-react";
import type { QuestionPatternOption } from "@/lib/types";

export function QuestionPatternChips({
  patterns,
  selectedPatternIds,
  autoPatterns,
  onTogglePattern,
  onToggleAuto,
}: {
  patterns: QuestionPatternOption[];
  selectedPatternIds: Set<string>;
  autoPatterns: boolean;
  onTogglePattern: (id: string) => void;
  onToggleAuto: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {patterns.map((pattern) => {
          const isSelected = selectedPatternIds.has(pattern.id);
          return (
            <button
              key={pattern.id}
              type="button"
              onClick={() => onTogglePattern(pattern.id)}
              className={`font-jakarta px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                isSelected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-border text-foreground hover:border-primary/35 hover:bg-secondary/60"
              }`}
            >
              {pattern.name}
            </button>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-dashed border-border/60">
        <button
          type="button"
          onClick={onToggleAuto}
          className={`font-jakarta w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
            autoPatterns
              ? "bg-accent border-accent text-accent-foreground"
              : "bg-background border-border text-muted-foreground hover:border-accent/40 hover:bg-secondary/50 hover:text-foreground"
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Use all question patterns for this subtopic
        </button>
      </div>
    </>
  );
}
