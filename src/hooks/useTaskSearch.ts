import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TaskSearchResult {
  id: string;
  title: string;
  status: string;
  clients: { name: string } | null;
  projects: { name: string } | null;
}

export function useTaskSearch() {
  const [results, setResults] = useState<TaskSearchResult[]>([]);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, clients(name), projects(name)")
      .ilike("title", `%${term}%`)
      .limit(20);
    setResults((data as TaskSearchResult[]) || []);
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, search, clear };
}
