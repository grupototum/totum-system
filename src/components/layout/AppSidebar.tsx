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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
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
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
            <SidebarMenu>{renderItems(systemNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold">
            GT
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">Grupo Totum</span>
              <span className="text-xs text-white/40">Admin</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
