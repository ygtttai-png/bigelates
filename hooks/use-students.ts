"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentsService } from "@/services/students.service";
import type { Student } from "@/types";

interface UseStudentsOptions {
  studioId: string | null;
}

export function useStudents({ studioId }: UseStudentsOptions) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!studioId) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const service = new StudentsService(supabase);
      const data = await service.getAll(studioId);
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Öğrenciler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (!studioId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("students-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        () => {
          void fetchStudents();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [studioId, fetchStudents]);

  return { students, loading, error, refetch: fetchStudents };
}
