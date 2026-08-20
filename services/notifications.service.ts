import type {
  NotificationDelivery,
  NotificationPrefs,
  PushSubscriptionRow,
} from "@/types";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import type { PushSubscriptionKeys } from "@/lib/notifications/push";

export const DEFAULT_PREFS = {
  enabled: true,
  reminder_minutes: 30,
  summary_hour: 21,
  timezone: "Europe/Istanbul",
} as const;

export class NotificationsService {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async getSubscriptions(userId: string): Promise<PushSubscriptionRow[]> {
    const { data, error } = await this.supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as PushSubscriptionRow[];
  }

  /** Aynı cihaz tekrar abone olursa kaydı günceller (endpoint benzersiz) */
  async saveSubscription(
    userId: string,
    studioId: string | null,
    keys: PushSubscriptionKeys
  ): Promise<PushSubscriptionRow> {
    const { data, error } = await this.supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          studio_id: studioId,
          endpoint: keys.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          enabled: true,
          failure_count: 0,
        },
        { onConflict: "endpoint" }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as PushSubscriptionRow;
  }

  async removeSubscription(endpoint: string): Promise<void> {
    const { error } = await this.supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) throw new Error(error.message);
  }

  async removeSubscriptionById(id: string): Promise<void> {
    const { error } = await this.supabase.from("push_subscriptions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getPrefs(userId: string): Promise<NotificationPrefs | null> {
    const { data, error } = await this.supabase
      .from("notification_prefs")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as NotificationPrefs) ?? null;
  }

  async savePrefs(
    userId: string,
    prefs: Pick<NotificationPrefs, "enabled" | "reminder_minutes" | "summary_hour" | "timezone">
  ): Promise<NotificationPrefs> {
    const { data, error } = await this.supabase
      .from("notification_prefs")
      .upsert({ user_id: userId, ...prefs }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as NotificationPrefs;
  }

  async getRecentDeliveries(userId: string, limit = 10): Promise<NotificationDelivery[]> {
    const { data, error } = await this.supabase
      .from("notification_deliveries")
      .select("*")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []) as NotificationDelivery[];
  }

  /** Sunucudan bu kullanıcının cihazlarına test bildirimi gönderir */
  async sendTestPush(): Promise<number> {
    const { data, error } = await this.supabase.functions.invoke<{ delivered?: number; error?: string }>(
      "notify",
      { body: { mode: "test" } }
    );

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data?.delivered ?? 0;
  }
}
