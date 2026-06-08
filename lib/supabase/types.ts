import type { createClient } from "@/lib/supabase/client";

export type AppSupabaseClient = ReturnType<typeof createClient>;
