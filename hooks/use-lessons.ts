"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LessonsService } from "@/services/lessons.service";
import type { Lesson, LessonStatus } from "@/types";
import type { LessonInput } from "@/lib/validations/lesson";

interface UseLessonsOptions {
  studioId: string | null;
}

export function useLessons({ studioId }: UseLessonsOptions) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!studioId) {
      setLessons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const service = new LessonsService(supabase);
      const data = await service.getAll(studioId);
      setLessons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dersler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    void fetchLessons();
  }, [fetchLessons]);

  useEffect(() => {
    if (!studioId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("lessons-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lessons" },
        () => {
          void fetchLessons();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [studioId, fetchLessons]);

  const setStatus = useCallback(
    async (id: string, status: LessonStatus) => {
      const prev = lessons;
      setLessons((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
      try {
        const supabase = createClient();
        const service = new LessonsService(supabase);
        await service.setStatus(id, status);
      } catch (err) {
        setLessons(prev);
        throw err;
      }
    },
    [lessons]
  );

  const createLesson = useCallback(
    async (input: LessonInput) => {
      if (!studioId) throw new Error("Stüdyo bulunamadı");
      const supabase = createClient();
      const service = new LessonsService(supabase);
      const created = await service.create(studioId, input);
      setLessons((ls) => [...ls, created]);
      return created;
    },
    [studioId]
  );

  const updateLesson = useCallback(async (id: string, input: LessonInput) => {
    const supabase = createClient();
    const service = new LessonsService(supabase);
    const updated = await service.update(id, input);
    setLessons((ls) => ls.map((l) => (l.id === id ? updated : l)));
    return updated;
  }, []);

  const deleteLesson = useCallback(async (id: string) => {
    const supabase = createClient();
    const service = new LessonsService(supabase);
    await service.softDelete(id);
    setLessons((ls) => ls.filter((l) => l.id !== id));
  }, []);

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons,
    setStatus,
    createLesson,
    updateLesson,
    deleteLesson,
  };
}
