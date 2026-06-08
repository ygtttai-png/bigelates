import type { Payment, Student } from "@/types";
import type { AppSupabaseClient } from "@/lib/supabase/types";

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
