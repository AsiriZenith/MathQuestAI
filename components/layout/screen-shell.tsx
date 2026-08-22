import type { ReactNode } from "react";
import { GeometricDecorations } from "@/components/layout/geometric-decorations";
import { AppNav } from "@/components/layout/app-nav";

export function ScreenShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <GeometricDecorations />
      <AppNav />
      {children}
    </div>
  );
}
