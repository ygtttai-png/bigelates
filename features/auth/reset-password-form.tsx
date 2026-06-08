"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (authError) {
      setError("Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir.");
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
        <h1 className="text-[26px] font-bold">Yeni şifre belirle</h1>
        <p className="mb-6 mt-1.5 text-[var(--ink-2)]">Hesabınız için yeni bir şifre oluşturun.</p>

        {done ? (
          <div className="rounded-xl border border-[var(--green)] bg-[var(--green-soft)] px-4 py-3 text-sm text-[var(--green-ink)]">
            Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz…
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-[var(--rose)] bg-[var(--rose-soft)] px-3 py-2 text-sm text-[var(--rose-ink)]">
                {error}
              </div>
            )}
            {(["password", "confirmPassword"] as const).map((name) => (
              <div key={name} className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
                  {name === "password" ? "Yeni şifre" : "Şifre tekrar"}
                </label>
                <Input type="password" error={!!errors[name]} {...register(name)} />
                {errors[name] && (
                  <p className="mt-1 text-xs font-medium text-[var(--rose-ink)]">
                    {errors[name]?.message}
                  </p>
                )}
              </div>
            ))}
            <Button type="submit" size="lg" full disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor…" : "Şifreyi güncelle"}
            </Button>
          </>
        )}

        <p className="mt-5 text-center text-[13px]">
          <Link href="/login" className="font-semibold text-[var(--accent-ink)]">
            Giriş sayfasına dön
          </Link>
        </p>
      </form>
    </div>
  );
}
