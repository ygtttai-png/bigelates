export type UserRole = "admin" | "staff" | "user";
export type LessonType = "ozel" | "grup";
export type LessonStatus = "planlandi" | "geldi" | "gelmedi" | "iptal";
export type LessonRecurrence = "none" | "weekly" | "monthly";
export type PaymentStatus = "odendi" | "bekliyor";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  studio_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StudioSettings {
  price_ozel: number;
  price_grup: number;
  work_slots: number;
  accent_color: string;
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  settings: StudioSettings;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Student {
  id: string;
  studio_id: string;
  name: string;
  phone: string;
  type: LessonType;
  package_total: number;
  remaining: number;
  payment_status: PaymentStatus;
  join_date: string;
  notes: string | null;
  color: string;
  initials: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Lesson {
  id: string;
  studio_id: string;
  date: string;
  time: string;
  type: LessonType;
  status: LessonStatus;
  fee: number;
  note: string | null;
  recurrence: LessonRecurrence;
  recurrence_group_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  student_ids?: string[];
}

export interface LessonStudent {
  id: string;
  lesson_id: string;
  student_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  studio_id: string;
  student_id: string;
  amount: number;
  package_label: string;
  status: PaymentStatus;
  payment_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: UserRole;
          studio_id?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      studios: {
        Row: Studio;
        Insert: {
          name: string;
          slug: string;
          owner_id: string;
          settings?: StudioSettings;
        };
        Update: Partial<Omit<Studio, "id" | "created_at">>;
        Relationships: [];
      };
      students: {
        Row: Student;
        Insert: {
          studio_id: string;
          name: string;
          phone: string;
          type?: LessonType;
          package_total?: number;
          remaining?: number;
          payment_status?: PaymentStatus;
          join_date?: string;
          notes?: string | null;
          color?: string;
          initials?: string;
        };
        Update: Partial<Omit<Student, "id" | "created_at">>;
        Relationships: [];
      };
      lessons: {
        Row: Lesson;
        Insert: {
          studio_id: string;
          date: string;
          time: string;
          type: LessonType;
          status?: LessonStatus;
          fee?: number;
          note?: string | null;
          recurrence?: LessonRecurrence;
          recurrence_group_id?: string | null;
        };
        Update: Partial<Omit<Lesson, "id" | "created_at">>;
        Relationships: [];
      };
      lesson_students: {
        Row: LessonStudent;
        Insert: {
          lesson_id: string;
          student_id: string;
        };
        Update: Partial<Omit<LessonStudent, "id" | "created_at">>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: {
          studio_id: string;
          student_id: string;
          amount: number;
          package_label: string;
          status?: PaymentStatus;
          payment_date?: string;
        };
        Update: Partial<Omit<Payment, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      soft_delete_lessons: {
        Args: { p_lesson_ids: string[] };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      lesson_type: LessonType;
      lesson_status: LessonStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
