import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckSquare,
  Briefcase,
  DollarSign,
  LayoutDashboard,
  UserCog,
  Settings,
  ShieldCheck,
  Database,
  Shield,
  Monitor,
  LogOut,
  Package,
  Box,
  Tags,
  FileText,
  Truck,
  List,
  BarChart3,
  Clock,
  Upload,
  ChevronRight,
  Gauge,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
import logoRed from "@/assets/logo-red.png";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTenant } from "@/contexts/TenantContext";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const navGroups = [
  {
    title: "Dashboards",
    icon: LayoutDashboard,
    items: [
      { title: "Visão Geral", url: "/", permKey: null },
      { title: "Executivo", url: "/dashboard-executivo", permKey: "acessar_dashboard_executivo" },
    ]
  },
  {
    title: "Comercial",
    icon: List,
    items: [
      { title: "Clientes", url: "/clientes", icon: Users, permKey: "cli_geral.visualizar" },
      { title: "Pacotes", url: "/pacotes", icon: Box, permKey: "prod_geral.visualizar" },
      { title: "Contratos", url: "/contratos", icon: FileText, permKey: null },
    ]
  },
  {
    title: "Operacional",
    icon: Briefcase,
    items: [
      { title: "Tarefas", url: "/tarefas", icon: CheckSquare, permKey: "tar_geral.visualizar" },
      { title: "Projetos", url: "/projetos", icon: Briefcase, permKey: "proj_geral.visualizar" },
      { title: "Entregas", url: "/entregas", icon: Truck, permKey: null },
    ]
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    items: [
      { title: "Financeiro", url: "/financeiro", icon: DollarSign, permKey: "fin_geral.visualizar" },
    ]
  },
  {
    title: "Cadastros Base",
    icon: Database,
    items: [
      { title: "Produtos", url: "/produtos", icon: Package, permKey: "prod_geral.visualizar" },
      { title: "Categorias", url: "/cadastros", icon: Tags, permKey: "cad_geral.visualizar" },
      { title: "Equipe", url: "/equipe", icon: UserCog, permKey: "usr_usuarios.visualizar" },
    ]
  },
  {
    title: "Administração",
    icon: Shield,
    items: [
      { title: "Permissões", url: "/usuarios", icon: Shield, permKey: "usr_permissoes.editar" },
      { title: "Configurações", url: "/configuracoes", icon: Settings, permKey: null },
      { title: "Importação", url: "/importar", icon: Upload, permKey: null },
      { title: "Admin", url: "/admin", icon: ShieldCheck, permKey: null, adminOnly: true },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, user, signOut } = useAuth();
  const { isDemoMode, toggleDemo } = useDemo();
  const { resolvedTheme } = useTheme();
  const { isAdmin, hasPermission, hasAnyPermission } = usePermissions();
  const { tenant } = useTenant();

  // Per-tenant logos: dark mode = logo_url (white version), light mode = logo_url_light (dark version)
  const defaultLogo = resolvedTheme === "dark" ? logoWhite : logoRed;
  const tenantLogoDark = tenant?.logo_url;
  const tenantLogoLight = tenant?.logo_url_light ?? tenant?.logo_url;
  const currentLogo = resolvedTheme === "dark"
    ? (tenantLogoDark ?? defaultLogo)
    : (tenantLogoLight ?? defaultLogo);
  const location = useLocation();
  const [hasExecDashboard, setHasExecDashboard] = useState(false);

  useEffect(() => {
    if (!user) { setHasExecDashboard(false); return; }
    if (isAdmin) { setHasExecDashboard(true); return; }
    const perms = profile?.roles?.permissions as Record<string, boolean> | null;
    if (perms?.acessar_dashboard_executivo) setHasExecDashboard(true);
  }, [user, isAdmin, profile]);

  const filteredGroups = useMemo(() =>
    navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if ((item as any).adminOnly && !isAdmin) return false;
        if (item.permKey === "acessar_dashboard_executivo") return hasExecDashboard;
        if (!item.permKey) return true;
        return isAdmin || hasPermission(item.permKey);
      })
    })).filter(group => group.items.length > 0),
    [isAdmin, hasPermission, hasExecDashboard]
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <img
            src={currentLogo}
            alt={tenant?.display_name ?? "Totum"}
            className={`${collapsed ? "h-6" : "h-7"} max-w-[140px] object-contain transition-opacity duration-300`}
          />
        </div>
        {/* Avatar do usuário — topo, logo abaixo do logo */}
        <Link
          to="/configuracoes"
          className="mt-4 flex items-center gap-3 rounded-lg p-1 -m-1 transition-colors hover:bg-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mt-3"
        >
          <UserAvatar avatarUrl={profile?.avatar_url} fullName={profile?.full_name || "Grupo Totum"} size="sm" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{profile?.full_name || "Grupo Totum"}</span>
              <span className="text-xs text-muted-foreground">{profile?.roles?.name || "Usuário"}</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2">
        <SidebarMenu>
          {filteredGroups.map((group) =>
            collapsed ? (
              /* Rail recolhido: ícone abre um popover com as páginas */
              <SidebarMenuItem key={group.title}>
                <Popover>
                  <PopoverTrigger asChild>
                    <SidebarMenuButton tooltip={group.title} className="justify-center">
                      <group.icon className="h-5 w-5 shrink-0 text-primary" />
                    </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="start" sideOffset={8} className="w-56 p-1.5">
                    <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group.title}</p>
                    <div className="flex flex-col">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.title}
                          to={item.url}
                          className="rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                          activeClassName="text-primary font-medium"
                        >
                          {item.title}
                        </NavLink>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            ) : (
              /* Expandido: submenu inline recolhível com animação fluida */
              <Collapsible key={group.title} asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={group.title}>
                      <group.icon className="h-4 w-4 shrink-0 text-primary transition-colors" />
                      <span>{group.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <SidebarMenuSub>
                      {group.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={location.pathname === item.url}>
                            <NavLink
                              to={item.url}
                              className="flex items-center gap-2 py-1.5 transition-colors"
                              activeClassName="text-primary font-medium"
                            >
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          )}
        </SidebarMenu>

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

      <SidebarFooter className="p-4 border-t border-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
