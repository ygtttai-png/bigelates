import { Suspense } from "react";
import { LessonForm } from "@/features/lessons/lesson-form";
import { LoadingState } from "@/components/ui/loading-state";

export default function NewLessonPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LessonForm />
    </Suspense>
  );
}
