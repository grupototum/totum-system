import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskTemplateManager } from "@/components/templates/TaskTemplateManager";
import { ProjectTemplateManager } from "@/components/templates/ProjectTemplateManager";

export default function Templates() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Modelos reutilizáveis para padronizar projetos e tarefas</p>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="bg-white/[0.04] border border-border">
          <TabsTrigger value="projects">Templates de Projeto</TabsTrigger>
          <TabsTrigger value="tasks">Templates de Tarefa</TabsTrigger>
        </TabsList>
        <TabsContent value="projects">
          <ProjectTemplateManager />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
