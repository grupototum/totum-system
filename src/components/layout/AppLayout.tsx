import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationCenter } from "./NotificationCenter";
import { TaskSearch } from "./TaskSearch";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <TaskSearch />
              <NotificationCenter />
            </div>
          </header>
          <main className="flex-1 overflow-auto scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
