"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProfileService } from "@/services/profile.service";
import type { Profile, Studio } from "@/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const service = new ProfileService(supabase);
      const p = await service.getCurrentProfile();
      setProfile(p);
      if (p?.studio_id) {
        const s = await service.getStudio(p.studio_id);
        setStudio(s);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { profile, studio, loading, error, refetch: fetchProfile };
}
