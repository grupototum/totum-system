import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { demoNotifications } from "@/data/demoData";
import { listRecentNotifications, markNotificationRead, markAllNotificationsRead } from "@/data/notifications.repo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationCenter() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setNotifications(demoNotifications);
      setUnreadCount(demoNotifications.filter(n => !n.is_read).length);
      return;
    }
    if (!user) return;
    const items = await listRecentNotifications(user.id, 20).catch(() => []);
    setNotifications(items);
    setUnreadCount(items.filter((n: any) => !n.is_read).length);
  }, [user, isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetch]);

  const markAsRead = async (id: string) => {
    if (isDemoMode) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (isDemoMode) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      return;
    }
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const typeColors: Record<string, string> = {
    warning: "bg-amber-500",
    error: "bg-red-500",
    success: "bg-emerald-500",
    info: "bg-blue-500",
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card border-border">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Marcar todas como lidas</button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Sem notificações</div>
          ) : notifications.map(n => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-white/[0.03] transition-colors ${!n.is_read ? "bg-white/[0.02]" : ""}`}
            >
              <div className="flex gap-2">
                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? (typeColors[n.type] || "bg-primary") : "bg-transparent"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), "dd/MM HH:mm", { locale: ptBR })}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
