"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) {
      setError("E-posta gönderilemedi. Lütfen tekrar deneyin.");
      return;
    }

    setSent(true);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
        <h1 className="text-[26px] font-bold">Şifremi unuttum</h1>
        <p className="mb-6 mt-1.5 text-[var(--ink-2)]">
          E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
        </p>

        {sent ? (
          <div className="rounded-xl border border-[var(--green)] bg-[var(--green-soft)] px-4 py-3 text-sm text-[var(--green-ink)]">
            Sıfırlama bağlantısı gönderildi. E-postanızı kontrol edin.
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-[var(--rose)] bg-[var(--rose-soft)] px-3 py-2 text-sm text-[var(--rose-ink)]">
                {error}
              </div>
            )}
            <div className="mb-5">
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">E-posta</label>
              <Input type="email" error={!!errors.email} {...register("email")} />
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-[var(--rose-ink)]">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" size="lg" full disabled={isSubmitting}>
              {isSubmitting ? "Gönderiliyor…" : "Bağlantı gönder"}
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
