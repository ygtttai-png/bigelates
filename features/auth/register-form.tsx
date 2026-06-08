"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = (await res.json()) as { error?: string };

    if (!res.ok) {
      setError(json.error ?? "Kayıt başarısız");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[420px] rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
        <h1 className="text-[26px] font-bold">Hesap oluştur</h1>
        <p className="mb-6 mt-1.5 text-[var(--ink-2)]">Stüdyonuzu kurun ve hemen başlayın.</p>

        {error && (
          <div className="mb-4 rounded-xl border border-[var(--rose)] bg-[var(--rose-soft)] px-3 py-2 text-sm text-[var(--rose-ink)]">
            {error}
          </div>
        )}

        {(
          [
            ["fullName", "Ad Soyad", "text"],
            ["email", "E-posta", "email"],
            ["studioName", "Stüdyo Adı", "text"],
            ["password", "Şifre", "password"],
            ["confirmPassword", "Şifre Tekrar", "password"],
          ] as const
        ).map(([name, label, type]) => (
          <div key={name} className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">{label}</label>
            <Input
              type={type}
              error={!!errors[name]}
              {...register(name)}
            />
            {errors[name] && (
              <p className="mt-1 text-xs font-medium text-[var(--rose-ink)]">
                {errors[name]?.message}
              </p>
            )}
          </div>
        ))}

        <Button type="submit" size="lg" full disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Kayıt yapılıyor…" : "Kayıt ol"}
        </Button>

        <p className="mt-5 text-center text-[13px] text-[var(--ink-3)]">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent-ink)]">
            Giriş yap
          </Link>
        </p>
      </form>
    </div>
  );
}
