"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentsService } from "@/services/students.service";
import type { StudentInput } from "@/lib/validations/student";
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

  const createStudent = useCallback(
    async (input: StudentInput) => {
      if (!studioId) throw new Error("Stüdyo bulunamadı");
      const supabase = createClient();
      const service = new StudentsService(supabase);
      const created = await service.create(studioId, input);
      setStudents((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    },
    [studioId]
  );

  const updateStudent = useCallback(async (id: string, input: StudentInput) => {
    const supabase = createClient();
    const service = new StudentsService(supabase);
    const updated = await service.update(id, input);
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? updated : s)).sort((a, b) => a.name.localeCompare(b.name))
    );
    return updated;
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    const supabase = createClient();
    const service = new StudentsService(supabase);
    await service.softDelete(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  };
}
