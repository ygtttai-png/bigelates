"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "./toast-provider";
import { useProfile } from "@/hooks/use-profile";
import { useLessons } from "@/hooks/use-lessons";
import { useStudents } from "@/hooks/use-students";
import type { Lesson, Profile, Student, Studio } from "@/types";
import type { LessonInput } from "@/lib/validations/lesson";
import type { LessonStatus } from "@/types";

interface AppContextValue {
  profile: Profile | null;
  studio: Studio | null;
  lessons: Lesson[];
  students: Student[];
  loading: boolean;
  error: string | null;
  setLessonStatus: (id: string, status: LessonStatus) => Promise<void>;
  createLesson: (input: LessonInput) => Promise<Lesson>;
  updateLesson: (id: string, input: LessonInput) => Promise<Lesson>;
  deleteLesson: (id: string) => Promise<void>;
  studentById: (id: string) => Student | undefined;
}

const AppContext = React.createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { profile, studio, loading: profileLoading, error: profileError } = useProfile();
  const studioId = profile?.studio_id ?? null;
  const {
    lessons,
    loading: lessonsLoading,
    error: lessonsError,
    setStatus,
    createLesson,
    updateLesson,
    deleteLesson,
  } = useLessons({ studioId });
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
  } = useStudents({ studioId });

  const studentById = React.useCallback(
    (id: string) => students.find((s) => s.id === id),
    [students]
  );

  const value: AppContextValue = {
    profile,
    studio,
    lessons,
    students,
    loading: profileLoading || lessonsLoading || studentsLoading,
    error: profileError ?? lessonsError ?? studentsError,
    setLessonStatus: setStatus,
    createLesson,
    updateLesson,
    deleteLesson,
    studentById,
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ToastProvider>
        <AppContext.Provider value={value}>{children}</AppContext.Provider>
      </ToastProvider>
    </ThemeProvider>
  );
}
