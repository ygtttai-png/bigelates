import type { Lesson, LessonStatus } from "@/types";
import type { LessonDeleteScope, LessonInput } from "@/lib/validations/lesson";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { StudentsService } from "@/services/students.service";
import { consumesPackageCredit } from "@/utils/lessons";
import { generateRecurringDates } from "@/utils/recurrence";

const IN_CHUNK_SIZE = 80;

export class LessonsService {
  private readonly students: StudentsService;

  constructor(private readonly supabase: AppSupabaseClient) {
    this.students = new StudentsService(supabase);
  }

  private async fetchStudentLinks(lessonIds: string[]): Promise<Map<string, string[]>> {
    const byLesson = new Map<string, string[]>();
    if (lessonIds.length === 0) return byLesson;

    for (let i = 0; i < lessonIds.length; i += IN_CHUNK_SIZE) {
      const chunk = lessonIds.slice(i, i + IN_CHUNK_SIZE);
      const { data, error } = await this.supabase
        .from("lesson_students")
        .select("lesson_id, student_id")
        .in("lesson_id", chunk);

      if (error) throw new Error(error.message);

      ((data ?? []) as { lesson_id: string; student_id: string }[]).forEach((l) => {
        const arr = byLesson.get(l.lesson_id) ?? [];
        arr.push(l.student_id);
        byLesson.set(l.lesson_id, arr);
      });
    }

    return byLesson;
  }

  private async attachStudentIds(lessons: Lesson[]): Promise<Lesson[]> {
    const links = await this.fetchStudentLinks(lessons.map((l) => l.id));
    return lessons.map((l) => ({
      ...l,
      recurrence: l.recurrence ?? "none",
      recurrence_group_id: l.recurrence_group_id ?? null,
      student_ids: links.get(l.id) ?? [],
    }));
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

    const links = await this.fetchStudentLinks((lessons ?? []).map((l) => l.id));

    return ((lessons ?? []) as Lesson[]).map((l) => ({
      ...l,
      recurrence: l.recurrence ?? "none",
      recurrence_group_id: l.recurrence_group_id ?? null,
      student_ids: links.get(l.id) ?? [],
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

    const links = await this.fetchStudentLinks([id]);
    const lesson = data as Lesson;

    return {
      ...lesson,
      recurrence: lesson.recurrence ?? "none",
      recurrence_group_id: lesson.recurrence_group_id ?? null,
      student_ids: links.get(id) ?? [],
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

  private async refundPackageCredits(lessons: Lesson[]): Promise<void> {
    const refunds = new Map<string, number>();

    for (const lesson of lessons) {
      if (!consumesPackageCredit(lesson.status)) continue;
      for (const studentId of lesson.student_ids ?? []) {
        refunds.set(studentId, (refunds.get(studentId) ?? 0) + 1);
      }
    }

    for (const [studentId, count] of refunds) {
      await this.students.adjustPackageCredits([studentId], count);
    }
  }

  async softDelete(id: string, scope: LessonDeleteScope = "single"): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Ders bulunamadı");

    let targets: Lesson[] = [existing];

    if (scope === "future" && existing.recurrence_group_id) {
      const { data, error } = await this.supabase
        .from("lessons")
        .select("*")
        .eq("recurrence_group_id", existing.recurrence_group_id)
        .gte("date", existing.date)
        .is("deleted_at", null);

      if (error) throw new Error(error.message);
      targets = await this.attachStudentIds((data ?? []) as Lesson[]);
      if (targets.length === 0) targets = [existing];
    }

    await this.refundPackageCredits(targets);

    const ids = targets.map((l) => l.id);
    const { data: deleted, error: deleteError } = await this.supabase
      .from("lessons")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids)
      .select("id");

    if (deleteError) throw new Error(deleteError.message);
    if (!deleted?.length) throw new Error("Ders silinemedi — yetki hatası olabilir");
  }
}
