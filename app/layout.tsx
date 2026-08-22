import type { Metadata } from "next";
import { plusJakartaSans, dmSans } from "./fonts";
import { PracticeSessionProvider } from "@/components/providers/practice-session-provider";
import { ScreenShell } from "@/components/layout/screen-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "MathQuestAI",
  description: "AI-powered mathematics question generation research prototype.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${dmSans.variable}`}>
      <body>
        <PracticeSessionProvider>
          <ScreenShell>{children}</ScreenShell>
        </PracticeSessionProvider>
      </body>
    </html>
  );
}
