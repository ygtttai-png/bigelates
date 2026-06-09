import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { registerSchema } from "@/lib/validations/auth";
import type { Studio } from "@/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Geçersiz veri" },
        { status: 400 }
      );
    }

    const { fullName, email, password, studioName } = parsed.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceKey ||
      supabaseUrl.includes("placeholder") ||
      serviceKey.includes("placeholder")
    ) {
      return NextResponse.json(
        { error: "Supabase yapılandırması eksik. .env.local dosyasını kontrol edin." },
        { status: 500 }
      );
    }

    const admin: SupabaseClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // admin.createUser: e-posta onayı olmadan hesap oluşturur
    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "admin" },
    });

    if (createError || !authData.user) {
      const msg = createError?.message ?? "Kayıt başarısız";
      const friendly =
        msg.includes("already been registered") || msg.includes("already exists")
          ? "Bu e-posta adresi zaten kayıtlı"
          : msg;
      return NextResponse.json({ error: friendly }, { status: 400 });
    }

    const userId = authData.user.id;
    const slug = `${slugify(studioName)}-${userId.slice(0, 8)}`;

    const { data: studio, error: studioError } = await admin
      .from("studios")
      .insert({
        name: studioName,
        slug,
        owner_id: userId,
        settings: {
          price_ozel: 750,
          price_grup: 250,
          work_slots: 12,
          accent_color: "#7C9A6F",
        },
      })
      .select()
      .single();

    const studioRow = studio as Studio | null;

    if (studioError || !studioRow) {
      // Kullanıcı oluştu ama stüdyo oluşmadı — temizlik
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: studioError?.message ?? "Stüdyo oluşturulamadı. Migration'ları çalıştırdınız mı?" },
        { status: 500 }
      );
    }

    // Trigger profil oluşturmuş olabilir — upsert ile güncelle
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role: "admin",
        studio_id: studioRow.id,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      await admin.from("studios").delete().eq("id", studioRow.id);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, studioId: studioRow.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Beklenmeyen hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
