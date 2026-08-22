import "server-only";
import { prisma } from "@/lib/prisma";
import type { QuestionPatternsResult, SubjectWithSubtopics } from "@/lib/types";

export async function getSubjectWithSubtopics(
  subjectName: string,
  topicName: string,
): Promise<SubjectWithSubtopics | null> {
  const subject = await prisma.subject.findFirst({
    where: { name: subjectName },
    select: { id: true, name: true },
  });
  if (!subject) return null;

  const topic = await prisma.topic.findFirst({
    where: { subjectId: subject.id, name: topicName },
    select: {
      id: true,
      name: true,
      subtopics: {
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!topic) return null;

  return {
    subject,
    topic: { id: topic.id, name: topic.name },
    subtopics: topic.subtopics,
  };
}

export async function getQuestionPatternsForSubtopic(
  subtopicId: string,
): Promise<QuestionPatternsResult> {
  try {
    const patterns = await prisma.questionPattern.findMany({
      where: { subtopicId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { ok: true, patterns };
  } catch {
    return { ok: false, error: "Unable to load question patterns." };
  }
}
