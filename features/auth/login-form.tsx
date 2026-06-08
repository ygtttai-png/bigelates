"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      setError("E-posta veya şifre hatalı");
      return;
    }

    const redirect = searchParams.get("redirect") || "/dashboard";
    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col overflow-hidden bg-gradient-to-br from-[var(--sage-ink)] to-[var(--sage)] p-14 text-white lg:flex">
        <div className="absolute -right-[60px] -top-20 h-80 w-80 rounded-full bg-white/8" />
        <div className="absolute -left-[50px] bottom-20 h-[200px] w-[200px] rounded-full bg-white/8" />
        <div className="relative flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-white/16">
            <span className="h-[13px] w-[13px] rounded-full border-[2.2px] border-white" />
          </div>
          <span className="text-[19px] font-extrabold tracking-tight">Bigelates</span>
        </div>
        <p className="relative mt-auto max-w-[460px] text-[25px] font-light leading-snug tracking-tight">
          Her ders, dengeyi yeniden bulmak için bir nefes. Stüdyonu tek ekrandan yönet.
        </p>
        <p className="relative mt-4 text-sm opacity-85">Bige Pilates Studio · Eğitmen Paneli</p>
      </div>

      <div className="grid place-items-center bg-[var(--bg)] p-6 lg:p-10">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[380px]">
          <div className="relative mb-5 grid h-14 w-14 place-items-center rounded-[17px] bg-gradient-to-br from-[var(--sage)] to-[var(--sage-ink)] shadow-[var(--shadow)]">
            <span className="h-[18px] w-[18px] rounded-full border-[3px] border-white" />
          </div>
          <h1 className="text-[26px] font-bold">Tekrar hoş geldin</h1>
          <p className="mb-6 mt-1.5 text-[var(--ink-2)]">Devam etmek için hesabına giriş yap.</p>

          {error && (
            <div className="mb-4 rounded-xl border border-[var(--rose)] bg-[var(--rose-soft)] px-3 py-2 text-sm text-[var(--rose-ink)]">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
              E-posta
            </label>
            <div className="relative">
              <Icon name="user" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
              <Input
                type="email"
                className="pl-10"
                placeholder="ornek@bigelates.com"
                error={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs font-medium text-[var(--rose-ink)]">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
              Şifre
            </label>
            <div className="relative">
              <Icon name="eye" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
              <Input type="password" className="pl-10" error={!!errors.password} {...register("password")} />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs font-medium text-[var(--rose-ink)]">{errors.password.message}</p>
            )}
          </div>

          <div className="mb-5 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-[var(--ink-2)]">
              <input type="checkbox" className="h-[17px] w-[17px] accent-[var(--accent)]" {...register("remember")} />
              Beni hatırla
            </label>
            <Link href="/forgot-password" className="text-[13.5px] font-semibold text-[var(--accent-ink)] no-underline">
              Şifremi unuttum
            </Link>
          </div>

          <Button type="submit" size="lg" full disabled={isSubmitting}>
            {isSubmitting ? "Giriş yapılıyor…" : "Giriş yap"}
          </Button>

          <p className="mt-5 text-center text-[13px] text-[var(--ink-3)]">
            Hesabın yok mu?{" "}
            <Link href="/register" className="font-semibold text-[var(--accent-ink)]">
              Kayıt ol
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
