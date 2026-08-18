import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const REALTIME_ENABLED = import.meta.env.VITE_ENABLE_REALTIME === "true";
const REALTIME_SCHEMA = import.meta.env.VITE_SUPABASE_SCHEMA || "totum_system";
const POLL_INTERVAL_MS = 60_000;

export function NotificationCenter() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead, refetch } = useNotifications(user?.id);

  // Atualização de notificações.
  //
  // Realtime fica DESLIGADO por padrão: o Supabase self-hosted
  // (supa.grupototum.com) não expõe /realtime/v1/websocket pelo proxy, e o
  // client entrava em loop infinito de reconexão poluindo o console com
  // "WebSocket connection ... failed". Enquanto o serviço não for exposto,
  // usamos polling. Para religar, defina VITE_ENABLE_REALTIME=true.
  useEffect(() => {
    if (!user) return;

    if (!REALTIME_ENABLED) {
      const timer = setInterval(() => { void refetch(); }, POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }

    const channel = supabase
      .channel("notifications-realtime")
      // O schema precisa ser o mesmo do PostgREST (totum_system), senão o
      // filtro nunca casa — antes estava cravado em "public".
      .on("postgres_changes", { event: "INSERT", schema: REALTIME_SCHEMA, table: "notifications", filter: `user_id=eq.${user.id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refetch]);

  const typeColors: Record<string, string> = {
    warning: "bg-amber-500",
    error: "bg-red-500",
    success: "bg-emerald-500",
    info: "bg-blue-500",
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unreadCount > 0 ? `Notificações (${unreadCount} não lidas)` : "Notificações"}
          className="relative text-muted-foreground hover:text-foreground"
        >
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
