import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckSquare,
  Briefcase,
  DollarSign,
  Gauge,
  UserCog,
  Settings,
  ShieldCheck,
  Database,
  Shield,
  Monitor,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
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
  { title: "Central do Cliente", url: "/clientes", icon: Users },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
  { title: "Projetos", url: "/projetos", icon: Briefcase },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
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
  const { profile, user, signOut } = useAuth();
  const { isDemoMode, toggleDemo } = useDemo();
  const [hasExecDashboard, setHasExecDashboard] = useState(false);

  const isAdmin =
    profile?.roles?.name?.toLowerCase() === "administrador" ||
    profile?.roles?.name?.toLowerCase() === "admin";

  useEffect(() => {
    if (!user) return;
    if (isAdmin) { setHasExecDashboard(true); return; }
    const perms = profile?.roles?.permissions as Record<string, boolean> | null;
    if (perms?.acessar_dashboard_executivo) setHasExecDashboard(true);
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
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 pb-6">
        <div className="flex items-center gap-3">
          <img src={logoWhite} alt="Totum" className={collapsed ? "h-6" : "h-7"} />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {hasExecDashboard && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-1">
              Estratégico
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderItems([{ title: "Dashboard Executivo", url: "/dashboard-executivo", icon: Gauge }])}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-1">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-1 mt-4">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(filteredSystemNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={toggleDemo}>
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isDemoMode 
                        ? "bg-amber-500/15 text-amber-400" 
                        : "hover:bg-white/[0.06] text-muted-foreground"
                    }`}>
                      <Monitor className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{isDemoMode ? "Sair do Demo" : "Modo Demo"}</span>}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <Link to="/configuracoes" className="flex items-center gap-3 rounded-lg p-1 -m-1 transition-colors hover:bg-white/[0.06]">
          <UserAvatar avatarUrl={profile?.avatar_url} fullName={profile?.full_name || "Grupo Totum"} size="sm" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{profile?.full_name || "Grupo Totum"}</span>
              <span className="text-xs text-muted-foreground">{profile?.roles?.name || "Usuário"}</span>
            </div>
          )}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
