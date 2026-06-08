import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">Yükleniyor…</div>}>
      <LoginForm />
    </Suspense>
  );
}
