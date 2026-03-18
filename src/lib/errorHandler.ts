import { supabase } from "@/integrations/supabase/client";

type ErrorCategory = "validation" | "permission" | "system" | "integration" | "network" | "unknown";

interface FriendlyError {
  title: string;
  description: string;
  category: ErrorCategory;
}

const ERROR_MAP: Record<string, FriendlyError> = {
  "row-level security": {
    title: "Sem permissão",
    description: "Você não tem permissão para realizar essa ação.",
    category: "permission",
  },
  "JWT expired": {
    title: "Sessão expirada",
    description: "Sua sessão expirou. Faça login novamente.",
    category: "permission",
  },
  "duplicate key": {
    title: "Registro duplicado",
    description: "Esse registro já existe no sistema.",
    category: "validation",
  },
  "violates foreign key": {
    title: "Referência inválida",
    description: "O registro referenciado não existe ou foi removido.",
    category: "validation",
  },
  "not_null_violation": {
    title: "Campo obrigatório",
    description: "Preencha todos os campos obrigatórios.",
    category: "validation",
  },
  "Failed to fetch": {
    title: "Erro de conexão",
    description: "Não foi possível conectar ao servidor. Verifique sua internet.",
    category: "network",
  },
  "NetworkError": {
    title: "Erro de rede",
    description: "Falha na conexão. Tente novamente em alguns instantes.",
    category: "network",
  },
};

export function getFriendlyError(error: unknown): FriendlyError {
  const msg = error instanceof Error ? error.message : String(error ?? "");

  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) {
      return friendly;
    }
  }

  if (msg.includes("permission") || msg.includes("denied") || msg.includes("403")) {
    return { title: "Sem permissão", description: "Você não tem permissão para realizar essa ação.", category: "permission" };
  }

  if (msg.includes("timeout") || msg.includes("TIMEOUT")) {
    return { title: "Tempo esgotado", description: "A operação demorou demais. Tente novamente.", category: "network" };
  }

  return {
    title: "Erro inesperado",
    description: "Ocorreu um erro ao processar. Tente novamente.",
    category: "unknown",
  };
}

export async function logError(
  error: unknown,
  context?: string,
  userId?: string
) {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const stack = error instanceof Error ? error.stack : undefined;
  const friendly = getFriendlyError(error);

  try {
    await supabase.from("error_logs").insert({
      user_id: userId || null,
      error_type: friendly.category,
      message: friendly.description,
      technical_message: msg,
      context: context || null,
      stack_trace: stack || null,
    });
  } catch {
    // Silent fail - don't throw from error logger
    console.error("[ErrorLogger] Failed to log error:", msg);
  }
}

export function handleApiError(error: unknown, context?: string, userId?: string) {
  const friendly = getFriendlyError(error);
  logError(error, context, userId);
  return friendly;
}
