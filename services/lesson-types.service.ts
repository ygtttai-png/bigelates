import type { LessonType } from "@/types";
import type { LessonTypeInput } from "@/lib/validations/lesson-type";
import type { AppSupabaseClient } from "@/lib/supabase/types";

export class LessonTypesService {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async getAll(studioId: string): Promise<LessonType[]> {
    const { data, error } = await this.supabase
      .from("lesson_types")
      .select("*")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      // Migration henüz uygulanmadıysa uygulamayı kilitleme; form eski
      // Özel/Grup seçimine düşer.
      if (isMissingTableError(error.code)) {
        console.warn("lesson_types tablosu yok — migration uygulanmamış olabilir");
        return [];
      }
      throw new Error(error.message);
    }
    return (data ?? []) as LessonType[];
  }

  async create(studioId: string, input: LessonTypeInput): Promise<LessonType> {
    const existing = await this.getAll(studioId);
    const sortOrder = existing.reduce((max, t) => Math.max(max, t.sort_order), -1) + 1;

    const { data, error } = await this.supabase
      .from("lesson_types")
      .insert({
        studio_id: studioId,
        name: input.name.trim(),
        kind: input.kind,
        price: input.price,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) throw new Error(translateError(error.message));
    return data as LessonType;
  }

  /**
   * Ad/ücret güncellemesi yalnızca bundan sonra eklenecek dersleri etkiler:
   * geçmiş dersler kendi fee ve type_label değerlerini taşır.
   */
  async update(id: string, input: LessonTypeInput): Promise<LessonType> {
    const { data, error } = await this.supabase
      .from("lesson_types")
      .update({
        name: input.name.trim(),
        kind: input.kind,
        price: input.price,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(translateError(error.message));
    return data as LessonType;
  }

  /** Pasife alma — kayıt silinmez, geçmiş dersler bozulmaz */
  async setArchived(id: string, archived: boolean): Promise<LessonType> {
    const { data, error } = await this.supabase
      .from("lesson_types")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as LessonType;
  }
}

/** 42P01: undefined_table */
function isMissingTableError(code?: string): boolean {
  return code === "42P01";
}

function translateError(message: string): string {
  if (message.includes("idx_lesson_types_unique_name")) {
    return "Bu isimde bir ders tipi zaten var";
  }
  return message;
}
