"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { usePushNotifications, type PushPrefsInput } from "@/hooks/use-push-notifications";
import { TR_MONTHS } from "@/utils/date";

const REMINDER_OPTIONS = [10, 15, 30, 45, 60];

function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Bilinmeyen cihaz";
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent)) return "Android telefon";
  if (/Windows/i.test(userAgent)) return "Windows bilgisayar";
  if (/Macintosh/i.test(userAgent)) return "Mac";
  return "Diğer cihaz";
}

function formatSentAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]?.slice(0, 3)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function NotificationsView() {
  const { profile } = useApp();
  const toast = useToast();
  const push = usePushNotifications({
    userId: profile?.id ?? null,
    studioId: profile?.studio_id ?? null,
  });

  const [savingPrefs, setSavingPrefs] = useState(false);

  const deviceTimezone =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  const updatePrefs = async (patch: Partial<PushPrefsInput>) => {
    setSavingPrefs(true);
    try {
      await push.savePrefs({ ...push.prefs, ...patch });
      toast("Tercihler kaydedildi", { tone: "green", icon: "check" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Kaydedilemedi", { tone: "rose", icon: "x" });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleEnable = async () => {
    try {
      await push.enable();
      // İlk açılışta cihazın saat dilimini kullan
      if (deviceTimezone && deviceTimezone !== push.prefs.timezone) {
        await push.savePrefs({ ...push.prefs, timezone: deviceTimezone });
      }
      toast("Bildirimler açıldı · bu cihaza gönderilecek", { tone: "green", icon: "check" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Bildirimler açılamadı", {
        tone: "rose",
        icon: "x",
      });
    }
  };

  const handleReset = async () => {
    try {
      await push.resetAndEnable();
      toast("Sıfırlandı · bildirimler açıldı", { tone: "green", icon: "check" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Sıfırlanamadı", {
        tone: "rose",
        icon: "x",
      });
    }
  };

  const handleDisable = async () => {
    try {
      await push.disable();
      toast("Bu cihazda bildirimler kapatıldı", { tone: "sage", icon: "check" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Kapatılamadı", { tone: "rose", icon: "x" });
    }
  };

  const handleTest = async () => {
    try {
      const delivered = await push.sendTest();
      toast(
        delivered > 0
          ? `Test bildirimi ${delivered} cihaza gönderildi`
          : "Kayıtlı cihaz bulunamadı — önce bildirimleri aç",
        { tone: delivered > 0 ? "green" : "rose", icon: delivered > 0 ? "check" : "x" }
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Test gönderilemedi", {
        tone: "rose",
        icon: "x",
      });
    }
  };

  if (push.loading) return <LoadingState />;

  const active = push.subscribedHere && push.permission === "granted";

  return (
    <>
      <PageHeader eyebrow="Stüdyo" title="Bildirimler" />

      {/* Durum */}
      <Card className="mb-4 p-5">
        <div className="flex items-start gap-3">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
              active
                ? "bg-[var(--green-soft)] text-[var(--green-ink)]"
                : "bg-[var(--surface-2)] text-[var(--ink-3)]"
            }`}
          >
            <Icon name="bell" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16.5px] font-bold">
                {active ? "Bu cihazda açık" : "Bu cihazda kapalı"}
              </h2>
              <Badge tone={active ? "green" : "muted"} size="sm">
                {active ? "Hazır" : "Kurulum gerekli"}
              </Badge>
            </div>
            <p className="mt-1 text-[13px] text-[var(--ink-3)]">
              Açıkken uygulama tamamen kapalı olsa bile telefonuna bildirim düşer:
              ders başlamadan {push.prefs.reminder_minutes} dakika önce hatırlatma ve her akşam{" "}
              {String(push.prefs.summary_hour).padStart(2, "0")}:00&apos;de yarının ders özeti.
            </p>
          </div>
        </div>

        {!push.supported && (
          <Notice tone="rose" icon="x" title="Bu tarayıcı desteklemiyor">
            Bildirimler için Chrome, Edge, Firefox veya Safari&apos;nin güncel sürümünü kullan.
          </Notice>
        )}

        {push.supported && push.needsInstall && (
          <Notice tone="gold" icon="alert" title="iPhone için tek adım gerekli">
            iPhone&apos;da bildirim yalnızca ana ekrana eklenmiş uygulamada çalışır. Safari&apos;de
            aç → <strong>Paylaş</strong> → <strong>Ana Ekrana Ekle</strong>, sonra uygulamayı ana
            ekrandaki simgeden açıp burada bildirimleri aç.
          </Notice>
        )}

        {push.supported && push.permission === "denied" && (
          <Notice tone="rose" icon="x" title="İzin reddedilmiş">
            Tarayıcı ayarlarından bu site için bildirim iznini &quot;İzin ver&quot; yapman
            gerekiyor, sonra bu sayfayı yenile.
          </Notice>
        )}

        {!push.configured && (
          <Notice tone="rose" icon="x" title="Sunucu anahtarı eksik">
            NEXT_PUBLIC_VAPID_PUBLIC_KEY ortam değişkeni tanımlı değil. Yayındaki uygulamaya
            eklenmesi gerekiyor.
          </Notice>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {active ? (
            <Button variant="secondary" onClick={() => void handleDisable()} disabled={push.busy}>
              <Icon name="x" size={17} /> Bu cihazda kapat
            </Button>
          ) : (
            <Button
              onClick={() => void handleEnable()}
              disabled={push.busy || !push.supported || !push.configured}
            >
              <Icon name="bell" size={17} /> Bildirimleri aç
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => void handleTest()}
            disabled={push.busy || push.devices.length === 0}
          >
            <Icon name="spark" size={17} /> Test bildirimi gönder
          </Button>
        </div>

        {push.supported && push.configured && (
          <div className="mt-3 border-t border-[var(--line)] pt-3">
            <p className="text-[12.5px] text-[var(--ink-3)]">
              &quot;Service worker hazır değil&quot; hatası alıyorsan, tarayıcıda eski bir
              kurulum takılı kalmış olabilir. Aşağıdaki düğme kaydı ve önbelleği temizleyip
              sıfırdan kurar.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => void handleReset()}
              disabled={push.busy}
            >
              <Icon name="repeat" size={15} /> Sıfırla ve yeniden dene
            </Button>
          </div>
        )}
      </Card>

      {/* Tercihler */}
      <Card className="mb-4 p-5">
        <h2 className="text-[16.5px] font-bold">Ne zaman bildirilsin</h2>
        <p className="mt-1 text-[13px] text-[var(--ink-3)]">
          Bu ayarlar tüm cihazların için geçerli.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-3">
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold">Bildirimler</div>
            <div className="text-[12.5px] text-[var(--ink-3)]">
              Kapatırsan hiçbir cihaza gönderilmez
            </div>
          </div>
          <Button
            variant={push.prefs.enabled ? "primary" : "secondary"}
            size="sm"
            onClick={() => void updatePrefs({ enabled: !push.prefs.enabled })}
            disabled={savingPrefs}
          >
            {push.prefs.enabled ? "Açık" : "Kapalı"}
          </Button>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
            Ders başlamadan önce
          </label>
          <div className="flex flex-wrap gap-1.5">
            {REMINDER_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={savingPrefs}
                onClick={() => void updatePrefs({ reminder_minutes: m })}
                className={`rounded-xl border px-3 py-2 text-[13.5px] font-semibold transition-all ${
                  push.prefs.reminder_minutes === m
                    ? "border-transparent bg-[var(--accent-soft)] text-[var(--accent-ink)] shadow-[var(--shadow-sm)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)]"
                }`}
              >
                {m} dk
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
            &quot;Yarın şu kadar dersin var&quot; özeti
          </label>
          <select
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3"
            value={push.prefs.summary_hour}
            disabled={savingPrefs}
            onChange={(e) => void updatePrefs({ summary_hour: Number(e.target.value) })}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-[var(--ink-3)]">
            Her gün bu saatte, ertesi günün ders sayısı ve ilk ders saati bildirilir.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[var(--ink-2)]">Saat dilimi</div>
            <div className="text-[12.5px] text-[var(--ink-3)]">{push.prefs.timezone}</div>
          </div>
          {deviceTimezone && deviceTimezone !== push.prefs.timezone && (
            <Button
              variant="secondary"
              size="sm"
              disabled={savingPrefs}
              onClick={() => void updatePrefs({ timezone: deviceTimezone })}
            >
              {deviceTimezone} kullan
            </Button>
          )}
        </div>
      </Card>

      {/* Cihazlar */}
      <Card className="mb-4 p-5">
        <h2 className="text-[16.5px] font-bold">Kayıtlı cihazlar</h2>
        <p className="mt-1 text-[13px] text-[var(--ink-3)]">
          Bildirim bu cihazların hepsine gider.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {push.devices.length === 0 ? (
            <p className="text-[13px] text-[var(--ink-3)]">
              Henüz cihaz yok. Yukarıdan &quot;Bildirimleri aç&quot; ile bu cihazı ekle.
            </p>
          ) : (
            push.devices.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{deviceLabel(d.user_agent)}</div>
                  <div className="text-[12.5px] text-[var(--ink-3)]">
                    Eklendi {formatSentAt(d.created_at)}
                    {d.last_success_at && ` · son bildirim ${formatSentAt(d.last_success_at)}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={push.busy}
                  onClick={() => void push.removeDevice(d.id)}
                >
                  <Icon name="trash" size={15} /> Kaldır
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Gönderilenler */}
      {push.deliveries.length > 0 && (
        <Card className="p-5">
          <h2 className="text-[16.5px] font-bold">Son gönderilenler</h2>
          <div className="mt-3 flex flex-col">
            {push.deliveries.map((d) => (
              <div
                key={d.id}
                className="border-b border-[var(--line-2)] py-2.5 last:border-b-0"
              >
                <div className="flex justify-between gap-2">
                  <span className="text-[14px] font-semibold">{d.title}</span>
                  <span className="shrink-0 text-[12px] text-[var(--ink-3)]">
                    {formatSentAt(d.sent_at)}
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] text-[var(--ink-2)]">{d.body}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function Notice({
  tone,
  icon,
  title,
  children,
}: {
  tone: "rose" | "gold";
  icon: "x" | "alert";
  title: string;
  children: React.ReactNode;
}) {
  const rose = tone === "rose";
  return (
    <div
      className={`mt-4 flex gap-2 rounded-xl border px-3 py-2.5 text-[13px] ${
        rose
          ? "border-[var(--rose)] bg-[var(--rose-soft)]"
          : "border-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_12%,transparent)]"
      }`}
    >
      <Icon
        name={icon}
        size={16}
        className={`mt-0.5 shrink-0 ${rose ? "text-[var(--rose-ink)]" : "text-[var(--gold)]"}`}
      />
      <span className="text-[var(--ink-2)]">
        <strong className={rose ? "text-[var(--rose-ink)]" : "text-[var(--gold)]"}>{title}</strong>
        <br />
        {children}
      </span>
    </div>
  );
}
