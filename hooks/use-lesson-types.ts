"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LessonTypesService } from "@/services/lesson-types.service";
import type { LessonTypeInput } from "@/lib/validations/lesson-type";
import type { LessonType } from "@/types";

interface UseLessonTypesOptions {
  studioId: string | null;
}

const byOrder = (a: LessonType, b: LessonType) =>
  a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);

export function useLessonTypes({ studioId }: UseLessonTypesOptions) {
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessonTypes = useCallback(async () => {
    if (!studioId) {
      setLessonTypes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const service = new LessonTypesService(createClient());
      setLessonTypes(await service.getAll(studioId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ders tipleri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    void fetchLessonTypes();
  }, [fetchLessonTypes]);

  const createLessonType = useCallback(
    async (input: LessonTypeInput) => {
      if (!studioId) throw new Error("Stüdyo bulunamadı");
      const service = new LessonTypesService(createClient());
      const created = await service.create(studioId, input);
      setLessonTypes((prev) => [...prev, created].sort(byOrder));
      return created;
    },
    [studioId]
  );

  const updateLessonType = useCallback(async (id: string, input: LessonTypeInput) => {
    const service = new LessonTypesService(createClient());
    const updated = await service.update(id, input);
    setLessonTypes((prev) => prev.map((t) => (t.id === id ? updated : t)).sort(byOrder));
    return updated;
  }, []);

  const setLessonTypeArchived = useCallback(async (id: string, archived: boolean) => {
    const service = new LessonTypesService(createClient());
    const updated = await service.setArchived(id, archived);
    setLessonTypes((prev) => prev.map((t) => (t.id === id ? updated : t)).sort(byOrder));
    return updated;
  }, []);

  return {
    lessonTypes,
    loading,
    error,
    refetch: fetchLessonTypes,
    createLessonType,
    updateLessonType,
    setLessonTypeArchived,
  };
}
