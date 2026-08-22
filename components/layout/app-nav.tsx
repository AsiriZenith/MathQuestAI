import { Sparkles } from "lucide-react";

export function AppNav() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
          <span className="font-jakarta text-primary-foreground font-bold text-sm leading-none">
            M
          </span>
        </div>
        <span className="font-jakarta font-bold text-[1.1rem] tracking-tight text-foreground">
          MathQuest AI
        </span>
      </div>
      <div className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-semibold px-3.5 py-1.5 rounded-full border border-border select-none">
        <Sparkles className="w-3 h-3 text-accent" />
        AI-Powered
      </div>
    </nav>
  );
}
