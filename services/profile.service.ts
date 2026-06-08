import type { Profile, Studio } from "@/types";
import type { AppSupabaseClient } from "@/lib/supabase/types";

export class ProfileService {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async getCurrentProfile(): Promise<Profile | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .is("deleted_at", null)
      .single();

    if (error) return null;
    return data as Profile;
  }

  async getStudio(studioId: string): Promise<Studio | null> {
    const { data, error } = await this.supabase
      .from("studios")
      .select("*")
      .eq("id", studioId)
      .is("deleted_at", null)
      .single();

    if (error) return null;
    return data as Studio;
  }
}
