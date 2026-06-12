import type { Lesson, LessonStatus } from "@/types";
import type { LessonDeleteScope, LessonInput } from "@/lib/validations/lesson";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { StudentsService } from "@/services/students.service";
import { consumesPackageCredit } from "@/utils/lessons";
import { generateRecurringDates } from "@/utils/recurrence";

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
      recurrence: l.recurrence ?? "none",
      recurrence_group_id: l.recurrence_group_id ?? null,
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

    const lesson = data as Lesson;
    return {
      ...lesson,
      recurrence: lesson.recurrence ?? "none",
      recurrence_group_id: lesson.recurrence_group_id ?? null,
      student_ids: ((links ?? []) as { student_id: string }[]).map((l) => l.student_id),
    };
  }

  private async linkStudents(lessonId: string, studentIds: string[]): Promise<void> {
    const { error } = await this.supabase.from("lesson_students").insert(
      studentIds.map((studentId) => ({
        lesson_id: lessonId,
        student_id: studentId,
      }))
    );
    if (error) throw new Error(error.message);
  }

  async create(studioId: string, input: LessonInput): Promise<Lesson> {
    const recurrence = input.recurrence ?? "none";
    const isRecurring = recurrence === "weekly" || recurrence === "monthly";
    const groupId = isRecurring ? crypto.randomUUID() : null;
    const dates = isRecurring
      ? generateRecurringDates(input.date, recurrence)
      : [input.date];

    const rows = dates.map((date, index) => ({
      studio_id: studioId,
      date,
      time: input.time,
      type: input.type,
      status: index === 0 ? input.status : ("planlandi" as LessonStatus),
      fee: input.fee,
      note: input.note ?? null,
      recurrence,
      recurrence_group_id: groupId,
    }));

    const { data, error } = await this.supabase.from("lessons").insert(rows).select();

    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("Ders oluşturulamadı");

    const createdLessons = data as Lesson[];

    for (const lesson of createdLessons) {
      await this.linkStudents(lesson.id, input.studentIds);
      if (consumesPackageCredit(lesson.status)) {
        await this.students.adjustPackageCredits(input.studentIds, -1);
      }
    }

    const first = createdLessons[0]!;
    return {
      ...first,
      recurrence: first.recurrence ?? recurrence,
      recurrence_group_id: first.recurrence_group_id ?? groupId,
      student_ids: input.studentIds,
    };
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

    await this.linkStudents(id, input.studentIds);

    if (consumesPackageCredit(input.status)) {
      await this.students.adjustPackageCredits(input.studentIds, -1);
    }

    const updated = data as Lesson;
    return {
      ...updated,
      recurrence: updated.recurrence ?? existing.recurrence,
      recurrence_group_id: updated.recurrence_group_id ?? existing.recurrence_group_id,
      student_ids: input.studentIds,
    };
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

  private async softDeleteOne(lesson: Lesson): Promise<void> {
    if (consumesPackageCredit(lesson.status)) {
      await this.students.adjustPackageCredits(lesson.student_ids ?? [], 1);
    }

    const { error } = await this.supabase
      .from("lessons")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", lesson.id);

    if (error) throw new Error(error.message);
  }

  async softDelete(id: string, scope: LessonDeleteScope = "single"): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Ders bulunamadı");

    if (
      scope === "future" &&
      existing.recurrence_group_id &&
      existing.recurrence !== "none"
    ) {
      const all = await this.getAll(existing.studio_id);
      const targets = all.filter(
        (l) =>
          l.recurrence_group_id === existing.recurrence_group_id &&
          l.date >= existing.date
      );

      for (const lesson of targets) {
        await this.softDeleteOne(lesson);
      }
      return;
    }

    await this.softDeleteOne(existing);
  }
}
