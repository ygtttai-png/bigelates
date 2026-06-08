import { StudentDetail } from "@/features/students/student-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <StudentDetail studentId={id} />;
}
