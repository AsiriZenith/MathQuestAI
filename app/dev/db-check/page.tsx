import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DbCheckPage() {
  const subjects = await prisma.subject.findMany();

  return (
    <main className="p-8 font-mono text-sm">
      <h1 className="text-lg font-bold mb-4">DB Connectivity Check — Subjects</h1>
      <pre>{JSON.stringify(subjects, null, 2)}</pre>
    </main>
  );
}
