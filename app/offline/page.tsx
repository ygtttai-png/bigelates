import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--ink-3)]">
        <Icon name="calendar" size={28} />
      </div>
      <h1 className="text-2xl font-bold">Çevrimdışısınız</h1>
      <p className="max-w-sm text-[var(--ink-2)]">
        İnternet bağlantınız yok. Daha önce görüntülediğiniz sayfalar çevrimdışı
        kullanılabilir.
      </p>
      <Button asChild>
        <Link href="/dashboard">Ana sayfaya dön</Link>
      </Button>
    </div>
  );
}
