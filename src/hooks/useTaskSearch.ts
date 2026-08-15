import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTaskSearch() {
  const [results, setResults] = useState<any[]>([]);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, clients(name), projects(name)")
      .ilike("title", `%${term}%`)
      .limit(20);
    setResults(data || []);
  }, []);

  return { results, search };
}