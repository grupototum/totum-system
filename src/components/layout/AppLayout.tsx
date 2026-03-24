import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationCenter } from "./NotificationCenter";
import { TaskSearch } from "./TaskSearch";
import { DemoBanner } from "./DemoBanner";
import { ThemeToggle } from "./ThemeToggle";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <DemoBanner />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center justify-between border-b border-border px-4 shrink-0 bg-background/80 backdrop-blur-sm">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="flex items-center gap-1">
                <TaskSearch />
                <ThemeToggle />
                <NotificationCenter />
              </div>
            </header>
            <main className="flex-1 overflow-auto scrollbar-thin">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
