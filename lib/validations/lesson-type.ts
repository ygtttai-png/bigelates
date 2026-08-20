import { z } from "zod";

export const lessonTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ders tipi adı en az 2 karakter olmalı")
    .max(40, "Ders tipi adı en fazla 40 karakter olabilir"),
  kind: z.enum(["ozel", "grup"]),
  price: z
    .number({ invalid_type_error: "Geçerli bir ücret girin" })
    .min(0, "Ücret negatif olamaz")
    .max(1_000_000, "Ücret çok yüksek"),
});

export type LessonTypeInput = z.infer<typeof lessonTypeSchema>;
