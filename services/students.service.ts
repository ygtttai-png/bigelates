import type { Payment, Student } from "@/types";
import type { StudentCreateInput, StudentUpdateInput } from "@/lib/validations/student";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { studentColor, studentInitials } from "@/utils/students";

export class StudentsService {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async getAll(studioId: string): Promise<Student[]> {
    const { data, error } = await this.supabase
      .from("students")
      .select("*")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Student[];
  }

  async getById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) return null;
    return data as Student;
  }

  async create(studioId: string, input: StudentCreateInput): Promise<Student> {
    const initials = studentInitials(input.name);
    const color = studentColor(input.name + input.phone);

    const { data, error } = await this.supabase
      .from("students")
      .insert({
        studio_id: studioId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        type: input.type,
        package_total: input.packageTotal,
        remaining: input.packageTotal,
        payment_status: input.paymentStatus,
        join_date: input.joinDate,
        notes: input.notes?.trim() || null,
        color,
        initials,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Student;
  }

  async update(id: string, input: StudentUpdateInput): Promise<Student> {
    const initials = studentInitials(input.name);

    const updates: Record<string, unknown> = {
      name: input.name.trim(),
      phone: input.phone.trim(),
      type: input.type,
      payment_status: input.paymentStatus,
      join_date: input.joinDate,
      notes: input.notes?.trim() || null,
      initials,
    };

    if (input.packageRenewal && input.packageRenewal > 0) {
      const current = await this.getById(id);
      if (!current) throw new Error("Öğrenci bulunamadı");
      updates.package_total = current.package_total + input.packageRenewal;
      updates.remaining = current.remaining + input.packageRenewal;
    }

    const { data, error } = await this.supabase
      .from("students")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Student;
  }

  /** Ders durumuna göre paket kredisi düş/geri ver (delta: -1 düş, +1 iade) */
  async adjustPackageCredits(studentIds: string[], delta: number): Promise<void> {
    if (delta === 0 || studentIds.length === 0) return;

    for (const studentId of studentIds) {
      const { data: student, error: fetchError } = await this.supabase
        .from("students")
        .select("remaining")
        .eq("id", studentId)
        .is("deleted_at", null)
        .single();

      if (fetchError || !student) continue;

      const current = (student as { remaining: number }).remaining;
      const next = Math.max(0, current + delta);

      const { error } = await this.supabase
        .from("students")
        .update({ remaining: next })
        .eq("id", studentId);

      if (error) throw new Error(error.message);
    }
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("students")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async getPayments(studentId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from("payments")
      .select("*")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("payment_date", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Payment[];
  }
}
