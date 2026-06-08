import { LessonForm } from "@/features/lessons/lesson-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: PageProps) {
  const { id } = await params;
  return <LessonForm lessonId={id} />;
}
