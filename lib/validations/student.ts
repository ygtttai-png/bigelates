import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı"),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
  type: z.enum(["ozel", "grup"]),
  packageTotal: z.number().int().min(1),
  remaining: z.number().int().min(0),
  paymentStatus: z.enum(["odendi", "bekliyor"]),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(2000).optional().nullable(),
});

export type StudentInput = z.infer<typeof studentSchema>;
