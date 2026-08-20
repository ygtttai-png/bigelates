"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "./toast-provider";
import { useProfile } from "@/hooks/use-profile";
import { useLessons } from "@/hooks/use-lessons";
import { useLessonTypes } from "@/hooks/use-lesson-types";
import { useStudents } from "@/hooks/use-students";
import type { Lesson, LessonType, Profile, Student, Studio } from "@/types";
import type { LessonDeleteScope, LessonInput } from "@/lib/validations/lesson";
import type { LessonTypeInput } from "@/lib/validations/lesson-type";
import type { StudentCreateInput, StudentUpdateInput } from "@/lib/validations/student";
import type { LessonStatus } from "@/types";

interface AppContextValue {
  profile: Profile | null;
  studio: Studio | null;
  lessons: Lesson[];
  students: Student[];
  lessonTypes: LessonType[];
  loading: boolean;
  error: string | null;
  setLessonStatus: (id: string, status: LessonStatus) => Promise<void>;
  createLesson: (input: LessonInput) => Promise<Lesson>;
  updateLesson: (id: string, input: LessonInput) => Promise<Lesson>;
  deleteLesson: (id: string, scope?: LessonDeleteScope) => Promise<void>;
  createStudent: (input: StudentCreateInput) => Promise<Student>;
  updateStudent: (id: string, input: StudentUpdateInput) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  studentById: (id: string) => Student | undefined;
  createLessonType: (input: LessonTypeInput) => Promise<LessonType>;
  updateLessonType: (id: string, input: LessonTypeInput) => Promise<LessonType>;
  setLessonTypeArchived: (id: string, archived: boolean) => Promise<LessonType>;
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
    createStudent,
    updateStudent,
    deleteStudent,
  } = useStudents({ studioId });
  const {
    lessonTypes,
    loading: lessonTypesLoading,
    error: lessonTypesError,
    createLessonType,
    updateLessonType,
    setLessonTypeArchived,
  } = useLessonTypes({ studioId });

  const studentById = React.useCallback(
    (id: string) => students.find((s) => s.id === id),
    [students]
  );

  const value: AppContextValue = {
    profile,
    studio,
    lessons,
    students,
    lessonTypes,
    loading: profileLoading || lessonsLoading || studentsLoading || lessonTypesLoading,
    error: profileError ?? lessonsError ?? studentsError ?? lessonTypesError,
    setLessonStatus: setStatus,
    createLesson,
    updateLesson,
    deleteLesson,
    createStudent,
    updateStudent,
    deleteStudent,
    studentById,
    createLessonType,
    updateLessonType,
    setLessonTypeArchived,
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ToastProvider>
        <AppContext.Provider value={value}>{children}</AppContext.Provider>
      </ToastProvider>
    </ThemeProvider>
  );
}
