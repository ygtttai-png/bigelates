import { z } from "zod";

export const lessonSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seçin"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Geçerli bir saat seçin"),
  type: z.enum(["ozel", "grup"]),
  studentIds: z.array(z.string().uuid()).min(1, "En az bir öğrenci seçin"),
  fee: z.number().min(0, "Ücret negatif olamaz"),
  status: z.enum(["planlandi", "geldi", "gelmedi", "iptal"]),
  note: z.string().max(2000).optional().nullable(),
  recurrence: z.enum(["none", "weekly", "monthly"]).default("none"),
});

export type LessonInput = z.infer<typeof lessonSchema>;
export type LessonDeleteScope = "single" | "future";
