import { useState, useEffect, useMemo } from "react";
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
  Package,
  LayoutTemplate,
  BookOpen,
  Clock,
  Upload,
  BarChart3,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
import logoRed from "@/assets/logo-red.png";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePermissions } from "@/hooks/usePermissions";
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

const allMainNav = [
  { title: "Central do Cliente", url: "/clientes", icon: Users, permKey: "cli_geral.visualizar" },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare, permKey: "tar_geral.visualizar" },
  { title: "Projetos", url: "/projetos", icon: Briefcase, permKey: "proj_geral.visualizar" },
  { title: "Produtos", url: "/produtos", icon: Package, permKey: "prod_geral.visualizar" },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, permKey: "fin_geral.visualizar" },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, permKey: "rel_financeiros.visualizar" },
  { title: "POPs", url: "/pops", icon: BookOpen, permKey: null },
  { title: "SLA", url: "/sla", icon: Clock, permKey: null },
];

const allSystemNav = [
  { title: "Equipe", url: "/equipe", icon: UserCog, permKey: "usr_usuarios.visualizar" },
  { title: "Cadastros", url: "/cadastros", icon: Database, permKey: "cad_geral.visualizar" },
  { title: "Importação", url: "/importar", icon: Upload, permKey: null },
  { title: "Permissões", url: "/usuarios", icon: Shield, permKey: "usr_permissoes.editar" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, permKey: null },
  { title: "Admin", url: "/admin", icon: ShieldCheck, permKey: null, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, user, signOut } = useAuth();
  const { isDemoMode, toggleDemo } = useDemo();
  const { resolvedTheme } = useTheme();
  const { isAdmin, hasPermission, hasAnyPermission } = usePermissions();
  const currentLogo = resolvedTheme === "dark" ? logoWhite : logoRed;
  const [hasExecDashboard, setHasExecDashboard] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (isAdmin) { setHasExecDashboard(true); return; }
    const perms = profile?.roles?.permissions as Record<string, boolean> | null;
    if (perms?.acessar_dashboard_executivo) setHasExecDashboard(true);
  }, [user, isAdmin, profile]);

  const mainNav = useMemo(() =>
    allMainNav.filter((item) => {
      if (!item.permKey) return true;
      return isAdmin || hasPermission(item.permKey);
    }),
    [isAdmin, hasPermission]
  );

  const filteredSystemNav = useMemo(() =>
    allSystemNav.filter((item) => {
      if ((item as any).adminOnly && !isAdmin) return false;
      if (!item.permKey) return true;
      return isAdmin || hasPermission(item.permKey);
    }),
    [isAdmin, hasPermission]
  );

  const renderItems = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent"
            activeClassName="bg-accent text-primary"
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
          <img src={currentLogo} alt="Totum" className={`${collapsed ? "h-6" : "h-7"} transition-opacity duration-300`} />
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
                {renderItems([{ title: "Dashboard Executivo", url: "/dashboard-executivo", icon: Gauge, permKey: null }])}
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

        {(isAdmin || (profile?.roles?.permissions as Record<string, boolean> | null)?.["cfg_modo_demo.visualizar"]) && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={toggleDemo}>
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isDemoMode 
                        ? "bg-amber-500/15 text-amber-400" 
                        : "hover:bg-accent text-muted-foreground"
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

      <SidebarFooter className="p-4 border-t border-border space-y-2">
        <Link to="/configuracoes" className="flex items-center gap-3 rounded-lg p-1 -m-1 transition-colors hover:bg-accent">
          <UserAvatar avatarUrl={profile?.avatar_url} fullName={profile?.full_name || "Grupo Totum"} size="sm" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{profile?.full_name || "Grupo Totum"}</span>
              <span className="text-xs text-muted-foreground">{profile?.roles?.name || "Usuário"}</span>
            </div>
          )}
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
