import { getSubjectWithSubtopics } from "@/lib/db/education";
import { SetupForm } from "@/app/_components/setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const data = await getSubjectWithSubtopics("Mathematics", "Algebra");

  if (!data) {
    return (
      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-14 pb-24">
        <p className="text-center text-sm text-muted-foreground">
          Unable to load practice setup data.
        </p>
      </main>
    );
  }

  return <SetupForm subject={data.subject} topic={data.topic} subtopics={data.subtopics} />;
}
