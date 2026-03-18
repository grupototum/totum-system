import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

export function TaskSearch() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  // Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, clients(name), projects(name)")
      .ilike("title", `%${term}%`)
      .limit(20);
    setResults(data || []);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-border text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors text-sm"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Buscar tarefas...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar tarefas..." onValueChange={handleSearch} />
        <CommandList>
          <CommandEmpty>Nenhuma tarefa encontrada.</CommandEmpty>
          <CommandGroup heading="Tarefas">
            {results.map(t => (
              <CommandItem
                key={t.id}
                onSelect={() => { setOpen(false); navigate("/tarefas"); }}
                className="flex items-center justify-between"
              >
                <div>
                  <span className="font-medium">{t.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {(t.clients as any)?.name}
                    {(t.projects as any)?.name && ` · ${(t.projects as any).name}`}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{t.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
