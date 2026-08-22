import { DIFFICULTY_OPTIONS } from "@/lib/mock-data";
import type { Difficulty } from "@/lib/types";

export function DifficultyToggle({
  value,
  onChange,
}: {
  value: Difficulty | "";
  onChange: (value: Difficulty | "") => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {DIFFICULTY_OPTIONS.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(isSelected ? "" : opt.id)}
            className={`font-jakarta py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
              isSelected
                ? opt.activeClass
                : `bg-background border-border text-muted-foreground ${opt.hoverClass}`
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
