"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { LessonTypeDialog } from "./lesson-type-dialog";
import { fmtMoney } from "@/utils/currency";
import type { LessonType } from "@/types";

export function SettingsView() {
  const { lessonTypes, lessons, loading, error, setLessonTypeArchived } = useApp();
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<LessonType | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const openNew = () => {
    setEditingType(null);
    setDialogOpen(true);
  };

  const openEdit = (lessonType: LessonType) => {
    setEditingType(lessonType);
    setDialogOpen(true);
  };

  const toggleArchived = async (lessonType: LessonType) => {
    setBusyId(lessonType.id);
    try {
      await setLessonTypeArchived(lessonType.id, !lessonType.archived_at);
      toast(
        lessonType.archived_at
          ? `${lessonType.name} yeniden aktif`
          : `${lessonType.name} pasife alındı · geçmiş dersler korunuyor`,
        { tone: lessonType.archived_at ? "green" : "sage", icon: "check" }
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "İşlem başarısız", {
        tone: "rose",
        icon: "x",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <EmptyState icon="x" message={error} />;

  const active = lessonTypes.filter((t) => !t.archived_at);
  const archived = lessonTypes.filter((t) => t.archived_at);

  /** Bir tipin kaç derste kullanıldığı — pasife alırken ne kaybolmadığını göstermek için */
  const usageCount = (typeId: string) =>
    lessons.filter((l) => l.lesson_type_id === typeId).length;

  return (
    <>
      <PageHeader
        eyebrow="Stüdyo"
        title="Ayarlar"
        action={
          <Button onClick={openNew} className="hidden lg:inline-flex">
            <Icon name="plus" size={18} /> Ders tipi ekle
          </Button>
        }
      />

      <Card className="mb-4 p-5">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16.5px] font-bold">Ders tipleri</h2>
            <p className="mt-1 text-[13px] text-[var(--ink-3)]">
              Ders eklerken çıkan seçenekler. Adı ve ücreti istediğin zaman
              güncelleyebilirsin.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {active.length === 0 ? (
            <EmptyState icon="note" message="Henüz ders tipi eklenmedi." />
          ) : (
            active.map((t) => (
              <LessonTypeRow
                key={t.id}
                lessonType={t}
                usage={usageCount(t.id)}
                busy={busyId === t.id}
                onEdit={() => openEdit(t)}
                onToggleArchived={() => void toggleArchived(t)}
              />
            ))
          )}
        </div>

        <Button variant="secondary" full className="mt-3 justify-center" onClick={openNew}>
          <Icon name="plus" size={17} /> Yeni ders tipi ekle
        </Button>

        <div className="mt-4 flex gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-[13px] text-[var(--ink-2)]">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-[var(--gold)]" />
          <span>
            <strong>Geçmiş kayıtlar değişmez.</strong> Her ders, kaydedildiği andaki adı ve
            ücretiyle saklanır. Fiyat güncellemesi yalnızca bundan sonra eklenecek dersleri
            etkiler.
          </span>
        </div>
      </Card>

      {archived.length > 0 && (
        <Card className="p-5">
          <h2 className="text-[16.5px] font-bold">Pasif ders tipleri</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-3)]">
            Ders eklerken listelenmez; geçmiş dersleri olduğu gibi durur.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {archived.map((t) => (
              <LessonTypeRow
                key={t.id}
                lessonType={t}
                usage={usageCount(t.id)}
                busy={busyId === t.id}
                onEdit={() => openEdit(t)}
                onToggleArchived={() => void toggleArchived(t)}
              />
            ))}
          </div>
        </Card>
      )}

      <LessonTypeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        lessonType={editingType}
      />
    </>
  );
}

interface LessonTypeRowProps {
  lessonType: LessonType;
  usage: number;
  busy: boolean;
  onEdit: () => void;
  onToggleArchived: () => void;
}

function LessonTypeRow({
  lessonType,
  usage,
  busy,
  onEdit,
  onToggleArchived,
}: LessonTypeRowProps) {
  const archived = !!lessonType.archived_at;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 ${archived ? "opacity-70" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[15px] font-semibold">{lessonType.name}</span>
          <Badge tone={lessonType.kind === "ozel" ? "sage" : "plum"} size="sm">
            {lessonType.kind === "ozel" ? "Tek kişilik" : "Grup"}
          </Badge>
        </div>
        <div className="mt-1 text-[13px] text-[var(--ink-3)]">
          <span className="tnum font-semibold text-[var(--ink-2)]">
            {fmtMoney(Number(lessonType.price))}
          </span>
          {lessonType.kind === "grup" ? " · kişi başı" : ""}
          {usage > 0 && ` · ${usage} derste kullanıldı`}
        </div>
      </div>

      <div className="flex gap-1.5">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Icon name="edit" size={15} /> Düzenle
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleArchived} disabled={busy}>
          {archived ? "Aktifleştir" : "Pasife al"}
        </Button>
      </div>
    </div>
  );
}
