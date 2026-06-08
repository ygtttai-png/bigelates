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

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Sunucu yapılandırması eksik" },
        { status: 500 }
      );
    }

    const admin: SupabaseClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: signUpError } = await admin.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "admin" },
      },
    });

    if (signUpError || !authData.user) {
      return NextResponse.json(
        { error: signUpError?.message ?? "Kayıt başarısız" },
        { status: 400 }
      );
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
          price_ozel: 500,
          price_grup: 200,
          work_slots: 12,
          accent_color: "#7C9A6F",
        },
      })
      .select()
      .single();

    const studioRow = studio as Studio | null;

    if (studioError || !studioRow) {
      return NextResponse.json(
        { error: studioError?.message ?? "Stüdyo oluşturulamadı" },
        { status: 500 }
      );
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        role: "admin",
        studio_id: studioRow.id,
      })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, studioId: studioRow.id });
  } catch {
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
