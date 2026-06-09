import { z } from "zod";

const baseFields = {
  name: z.string().min(2, "İsim en az 2 karakter olmalı"),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
  type: z.enum(["ozel", "grup"]),
  paymentStatus: z.enum(["odendi", "bekliyor"]),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seçin"),
  notes: z.string().max(2000).optional().nullable(),
};

/** Yeni öğrenci — sadece paket boyutu; kalan otomatik eşitlenir */
export const studentCreateSchema = z.object({
  ...baseFields,
  packageTotal: z.number().int().min(1, "Paket en az 1 ders olmalı"),
});

/** Düzenleme — isteğe bağlı paket yenileme */
export const studentUpdateSchema = z.object({
  ...baseFields,
  packageRenewal: z.number().int().min(0).optional(),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;

/** @deprecated use StudentCreateInput */
export type StudentInput = StudentCreateInput;
