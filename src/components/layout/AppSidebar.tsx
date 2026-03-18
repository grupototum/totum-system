import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  DollarSign,
  Briefcase,
  Package,
  BarChart3,
  Settings,
  UserCog,
  Database,
  CheckSquare,
  Shield,
  ShieldCheck,
  Gauge,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/shared/AvatarUpload";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
  { title: "Entregas", url: "/entregas", icon: ClipboardCheck },
  { title: "Contratos", url: "/contratos", icon: FileText },
  { title: "Projetos", url: "/projetos", icon: Briefcase },
];

const financeNav = [
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const systemNav = [
  { title: "Equipe", url: "/equipe", icon: UserCog },
  { title: "Cadastros", url: "/cadastros", icon: Database },
  { title: "Permissões", url: "/usuarios", icon: Shield },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Admin", url: "/admin", icon: ShieldCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, user } = useAuth();
  const [hasExecDashboard, setHasExecDashboard] = useState(false);

  const isAdmin =
    profile?.roles?.name?.toLowerCase() === "administrador" ||
    profile?.roles?.name?.toLowerCase() === "admin";

  // Check executive dashboard permission
  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      setHasExecDashboard(true);
      return;
    }
    // Check permission from roles.permissions JSON
    const perms = profile?.roles?.permissions as Record<string, boolean> | null;
    if (perms?.acessar_dashboard_executivo) {
      setHasExecDashboard(true);
    }
  }, [user, isAdmin, profile]);

  const filteredSystemNav = systemNav.filter(
    (item) => item.url !== "/admin" || isAdmin
  );

  const renderItems = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/[0.06]"
            activeClassName="bg-white/[0.08] text-primary"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-white/[0.08]">
      <SidebarHeader className="p-4 pb-6">
        <div className="flex items-center gap-3">
          <img
            src={logoWhite}
            alt="Totum"
            className={collapsed ? "h-6" : "h-7"}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-white/30 px-3 mb-1">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-white/30 px-3 mb-1 mt-4">
            Financeiro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(financeNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-white/30 px-3 mb-1 mt-4">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(filteredSystemNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/[0.06]">
        <Link to="/configuracoes" className="flex items-center gap-3 rounded-lg p-1 -m-1 transition-colors hover:bg-white/[0.06]">
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            fullName={profile?.full_name || "Grupo Totum"}
            size="sm"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{profile?.full_name || "Grupo Totum"}</span>
              <span className="text-xs text-white/40">{profile?.roles?.name || "Usuário"}</span>
            </div>
          )}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
