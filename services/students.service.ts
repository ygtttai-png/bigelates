import type { Payment, Student } from "@/types";
import type { StudentInput } from "@/lib/validations/student";
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

  async create(studioId: string, input: StudentInput): Promise<Student> {
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
        remaining: input.remaining,
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

  async update(id: string, input: StudentInput): Promise<Student> {
    const initials = studentInitials(input.name);

    const { data, error } = await this.supabase
      .from("students")
      .update({
        name: input.name.trim(),
        phone: input.phone.trim(),
        type: input.type,
        package_total: input.packageTotal,
        remaining: input.remaining,
        payment_status: input.paymentStatus,
        join_date: input.joinDate,
        notes: input.notes?.trim() || null,
        initials,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Student;
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
