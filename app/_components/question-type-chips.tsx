import { Shuffle } from "lucide-react";
import { QUESTION_TYPE_OPTIONS } from "@/lib/mock-data";

export function QuestionTypeChips({
  selectedTypes,
  autoTypes,
  onToggleType,
  onToggleAuto,
}: {
  selectedTypes: Set<string>;
  autoTypes: boolean;
  onToggleType: (id: string) => void;
  onToggleAuto: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {QUESTION_TYPE_OPTIONS.map((opt) => {
          const isSelected = selectedTypes.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggleType(opt.id)}
              className={`font-jakarta px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                isSelected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-border text-foreground hover:border-primary/35 hover:bg-secondary/60"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-dashed border-border/60">
        <button
          type="button"
          onClick={onToggleAuto}
          className={`font-jakarta w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
            autoTypes
              ? "bg-accent border-accent text-accent-foreground"
              : "bg-background border-border text-muted-foreground hover:border-accent/40 hover:bg-secondary/50 hover:text-foreground"
          }`}
        >
          <Shuffle className="w-3.5 h-3.5" />
          Generate a mix of different question types
        </button>
      </div>
    </>
  );
}
