"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { usePracticeSession } from "@/components/providers/practice-session-provider";
import { PracticeView } from "../_components/practice-view";

export default function PracticePage() {
  const router = useRouter();
  const params = useParams<{ questionNumber: string }>();
  const { config, generationResponse } = usePracticeSession();

  const questionNumber = Number(params.questionNumber);
  const questions = generationResponse?.questions ?? [];
  const index = questions.findIndex((q) => q.questionNumber === questionNumber);
  const question = index >= 0 ? questions[index] : null;
  const nextQuestion =
    index >= 0 && index < questions.length - 1 ? questions[index + 1] : null;

  useEffect(() => {
    if (!config || !generationResponse) {
      router.replace("/");
      return;
    }
    if (!question) {
      router.replace("/questions");
    }
  }, [config, generationResponse, question, router]);

  if (!config || !generationResponse || !question) return null;

  return (
    <main className="relative z-10 max-w-2xl mx-auto px-6 pb-24">
      <button
        type="button"
        onClick={() => router.push("/questions")}
        className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
        Back to Questions
      </button>

      <PracticeView
        key={question.questionNumber}
        question={question}
        hasNext={nextQuestion !== null}
        onNext={() => {
          if (nextQuestion) {
            router.push(`/questions/practice/${nextQuestion.questionNumber}`);
          }
        }}
        onBackToQuestions={() => router.push("/questions")}
      />
    </main>
  );
}
