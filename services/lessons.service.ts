import type { Lesson, LessonStatus } from "@/types";
import type { LessonInput } from "@/lib/validations/lesson";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { StudentsService } from "@/services/students.service";
import { consumesPackageCredit } from "@/utils/lessons";

export class LessonsService {
  private readonly students: StudentsService;

  constructor(private readonly supabase: AppSupabaseClient) {
    this.students = new StudentsService(supabase);
  }

  async getAll(studioId: string): Promise<Lesson[]> {
    const { data: lessons, error } = await this.supabase
      .from("lessons")
      .select("*")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) throw new Error(error.message);

    const { data: links, error: linkError } = await this.supabase
      .from("lesson_students")
      .select("lesson_id, student_id")
      .in("lesson_id", (lessons ?? []).map((l) => l.id));

    if (linkError) throw new Error(linkError.message);

    const byLesson = new Map<string, string[]>();
    ((links ?? []) as { lesson_id: string; student_id: string }[]).forEach((l) => {
      const arr = byLesson.get(l.lesson_id) ?? [];
      arr.push(l.student_id);
      byLesson.set(l.lesson_id, arr);
    });

    return ((lessons ?? []) as Lesson[]).map((l) => ({
      ...l,
      student_ids: byLesson.get(l.id) ?? [],
    }));
  }

  async getById(id: string): Promise<Lesson | null> {
    const { data, error } = await this.supabase
      .from("lessons")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) return null;

    const { data: links } = await this.supabase
      .from("lesson_students")
      .select("student_id")
      .eq("lesson_id", id);

    return {
      ...(data as Lesson),
      student_ids: ((links ?? []) as { student_id: string }[]).map((l) => l.student_id),
    };
  }

  async create(studioId: string, input: LessonInput): Promise<Lesson> {
    const { data, error } = await this.supabase
      .from("lessons")
      .insert({
        studio_id: studioId,
        date: input.date,
        time: input.time,
        type: input.type,
        status: input.status,
        fee: input.fee,
        note: input.note ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { error: linkError } = await this.supabase.from("lesson_students").insert(
      input.studentIds.map((studentId) => ({
        lesson_id: data.id,
        student_id: studentId,
      }))
    );

    if (linkError) throw new Error(linkError.message);

    if (consumesPackageCredit(input.status)) {
      await this.students.adjustPackageCredits(input.studentIds, -1);
    }

    return { ...(data as Lesson), student_ids: input.studentIds };
  }

  async update(id: string, input: LessonInput): Promise<Lesson> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Ders bulunamadı");

    if (consumesPackageCredit(existing.status)) {
      await this.students.adjustPackageCredits(existing.student_ids ?? [], 1);
    }

    const { data, error } = await this.supabase
      .from("lessons")
      .update({
        date: input.date,
        time: input.time,
        type: input.type,
        status: input.status,
        fee: input.fee,
        note: input.note ?? null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await this.supabase.from("lesson_students").delete().eq("lesson_id", id);

    const { error: linkError } = await this.supabase.from("lesson_students").insert(
      input.studentIds.map((studentId) => ({
        lesson_id: id,
        student_id: studentId,
      }))
    );

    if (linkError) throw new Error(linkError.message);

    if (consumesPackageCredit(input.status)) {
      await this.students.adjustPackageCredits(input.studentIds, -1);
    }

    return { ...(data as Lesson), student_ids: input.studentIds };
  }

  async setStatus(id: string, status: LessonStatus): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Ders bulunamadı");

    const oldStatus = existing.status;
    const studentIds = existing.student_ids ?? [];

    const { error } = await this.supabase
      .from("lessons")
      .update({ status })
      .eq("id", id);

    if (error) throw new Error(error.message);

    const wasConsuming = consumesPackageCredit(oldStatus);
    const nowConsuming = consumesPackageCredit(status);

    if (wasConsuming && !nowConsuming) {
      await this.students.adjustPackageCredits(studentIds, 1);
    } else if (!wasConsuming && nowConsuming) {
      await this.students.adjustPackageCredits(studentIds, -1);
    }
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Ders bulunamadı");

    if (consumesPackageCredit(existing.status)) {
      await this.students.adjustPackageCredits(existing.student_ids ?? [], 1);
    }

    const { error } = await this.supabase
      .from("lessons")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
