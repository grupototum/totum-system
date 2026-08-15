import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoNotifications } from "@/data/demoData";

export interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  user_id: string;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  const { isDemoMode } = useDemo();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setNotifications(demoNotifications as Notification[]);
      setUnreadCount(demoNotifications.filter((n: any) => !n.is_read).length);
      return;
    }
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    const items = (data || []) as Notification[];
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.is_read).length);
  }, [userId, isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const markAsRead = async (id: string) => {
    if (isDemoMode) {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return;
    }
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (isDemoMode) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      return;
    }
    if (!userId) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllRead, refetch: fetch };
}
